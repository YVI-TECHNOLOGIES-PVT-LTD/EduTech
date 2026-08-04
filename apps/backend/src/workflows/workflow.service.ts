import { supabase } from '../config/supabase';
import { RuleEvaluator } from './rule-evaluator';
import { NotificationService } from './NotificationService';

export class WorkflowService {
    
    /**
     * Start a new workflow run based on active version code.
     */
    static async startWorkflow(workflowCode: string, entityType: string, entityId: string, schoolId: string, performedBy?: string) {
        try {
            console.log(`[WorkflowService] Starting workflow "${workflowCode}" for ${entityType} ID: ${entityId}`);
            
            // 1. Fetch active workflow & version
            const { data: wf } = await supabase
                .from('workflows')
                .select('id')
                .eq('code', workflowCode)
                .single();
            if (!wf) throw new Error(`Workflow code "${workflowCode}" not found`);

            const { data: ver } = await supabase
                .from('workflow_versions')
                .select('*')
                .eq('workflow_id', wf.id)
                .eq('status', 'published')
                .single();
            if (!ver) throw new Error(`No published version found for workflow "${workflowCode}"`);

            // 2. Fetch context variables
            const { data: vars } = await supabase
                .from('workflow_variables')
                .select('*')
                .eq('workflow_version_id', ver.id);

            // Fetch target entity to build context
            const { data: entity } = await supabase.from(entityType + 's').select('*').eq('id', entityId).single();
            if (!entity) throw new Error(`Target ${entityType} record not found`);

            const variablesContext: Record<string, any> = {};
            if (vars) {
                for (const v of vars) {
                    variablesContext[v.variable_name] = entity[v.variable_name] ?? v.default_value;
                }
            }

            // Find Start node
            const startNode = ver.nodes.find((n: any) => n.type === 'start' || n.type === 'Start');
            if (!startNode) throw new Error("Workflow schema has no Start node");

            // 3. Create workflow run
            const { data: run, error: createError } = await supabase
                .from('workflow_runs')
                .insert({
                    version_id: ver.id,
                    entity_type: entityType,
                    entity_id: entityId,
                    school_id: schoolId,
                    current_node_id: startNode.id,
                    variables_context: variablesContext,
                    status: 'running'
                })
                .select()
                .single();

            if (createError) throw createError;

            // Log start event
            await this.logAudit(run.id, startNode.id, 'created', performedBy, 'Workflow run instantiated');

            // Move past start node
            await this.executeNode(run.id, startNode.id, entity, performedBy);
            return run;
        } catch (e: any) {
            console.error("[WorkflowService] startWorkflow Error:", e.message);
            throw e;
        }
    }

    /**
     * Executes logic for a visual node and handles transitions.
     */
    static async executeNode(runId: string, nodeId: string, entityContext: any, performedBy?: string) {
        try {
            // Get run state
            const { data: run } = await supabase.from('workflow_runs').select('*, workflow_versions(*)').eq('id', runId).single();
            if (!run || run.status === 'completed' || run.status === 'cancelled') return;

            const version = run.workflow_versions;
            const node = version.nodes.find((n: any) => n.id === nodeId);
            if (!node) throw new Error(`Node ID "${nodeId}" not found in layout schema`);

            console.log(`[WorkflowService] Executing node "${nodeId}" of type "${node.type}"`);

            // Update run current node pointer
            await supabase.from('workflow_runs').update({ current_node_id: nodeId }).eq('id', runId);

            switch (node.type?.toLowerCase()) {
                case 'start': {
                    const nextNodeId = this.getNextNode(version.connections, nodeId);
                    if (nextNodeId) {
                        await this.executeNode(runId, nextNodeId, entityContext, performedBy);
                    } else {
                        await this.completeRun(runId, performedBy);
                    }
                    break;
                }
                case 'step':
                case 'approval': {
                    // Create approval request & pending task
                    const role = node.data?.role || 'STAFF';
                    const name = node.data?.label || 'Approval Step';

                    const { data: appReq } = await supabase
                        .from('approval_requests')
                        .insert({
                            workflow_run_id: runId,
                            node_id: nodeId,
                            assigned_role: role,
                            status: 'pending'
                        })
                        .select()
                        .single();

                    const { data: task } = await supabase
                        .from('tasks')
                        .insert({
                            title: `Approval Needed: ${name}`,
                            description: `Workflow run for ${run.entity_type}. Review details to sign off.`,
                            assigned_role: role,
                            priority: node.data?.priority || 'medium',
                            status: 'pending',
                            related_entity_type: run.entity_type,
                            related_entity_id: run.entity_id
                        })
                        .select()
                        .single();

                    await supabase.from('workflow_runs').update({ status: 'waiting' }).eq('id', runId);
                    await this.logAudit(runId, nodeId, 'assigned', undefined, `Approval request assigned to role: ${role}`);
                    break;
                }
                case 'condition': {
                    // Fetch dynamic condition structure
                    const { data: condRecord } = await supabase
                        .from('workflow_conditions')
                        .select('*')
                        .eq('version_id', version.id)
                        .eq('node_id', nodeId)
                        .maybeSingle();

                    const conditionConfig = condRecord?.rules_config || node.data?.condition || {};
                    const evaluationOutcome = RuleEvaluator.evaluate(conditionConfig, entityContext);

                    await this.logAudit(runId, nodeId, 'viewed', undefined, `Condition evaluated outcome: ${evaluationOutcome}`);

                    // Find connected edge matching handles
                    const nextNodeId = this.getNextNodeForCondition(version.connections, nodeId, evaluationOutcome);
                    if (nextNodeId) {
                        await this.executeNode(runId, nextNodeId, entityContext, performedBy);
                    } else {
                        await this.completeRun(runId, performedBy);
                    }
                    break;
                }
                case 'action': {
                    // Fetch action configurations (ordered list support)
                    const { data: actionsList } = await supabase
                        .from('workflow_actions')
                        .select('*')
                        .eq('version_id', version.id)
                        .eq('node_id', nodeId)
                        .order('action_order', { ascending: true });

                    if (actionsList && actionsList.length > 0) {
                        for (const action of actionsList) {
                            try {
                                await this.runActionBlock(runId, action, entityContext);
                            } catch (actionErr: any) {
                                // Add details to DLQ
                                await supabase.from('workflow_dlq').insert({
                                    workflow_run_id: runId,
                                    node_id: nodeId,
                                    action_type: action.action_type,
                                    error_message: actionErr.message,
                                    payload: action.action_config
                                });
                                await supabase.from('workflow_runs').update({ status: 'failed' }).eq('id', runId);
                                await this.logAudit(runId, nodeId, 'failed', undefined, `Action Execution Failed: ${actionErr.message}`);
                                return; // Halt run
                            }
                        }
                    }

                    // Proceed to next node
                    const nextNodeId = this.getNextNode(version.connections, nodeId);
                    if (nextNodeId) {
                        await this.executeNode(runId, nextNodeId, entityContext, performedBy);
                    } else {
                        await this.completeRun(runId, performedBy);
                    }
                    break;
                }
                case 'notification': {
                    // Fetch notifications schema
                    const { data: notification } = await supabase
                        .from('workflow_notifications')
                        .select('*')
                        .eq('version_id', version.id)
                        .eq('node_id', nodeId)
                        .maybeSingle();

                    if (notification) {
                        const message = this.interpolateTemplate(notification.template, entityContext);
                        
                        // Push in-app alert via transport NotificationService pattern
                        if (entityContext.applicant_user_id) {
                            await NotificationService.send(
                                entityContext.applicant_user_id,
                                "Syllabus Alert",
                                message,
                                { run_id: runId }
                            );
                        }
                    }

                    const nextNodeId = this.getNextNode(version.connections, nodeId);
                    if (nextNodeId) {
                        await this.executeNode(runId, nextNodeId, entityContext, performedBy);
                    } else {
                        await this.completeRun(runId, performedBy);
                    }
                    break;
                }
                case 'end':
                default: {
                    await this.completeRun(runId, performedBy);
                    break;
                }
            }
        } catch (e: any) {
            console.error(`[WorkflowService] executeNode Error for ${nodeId}:`, e.message);
            await supabase.from('workflow_runs').update({ status: 'failed' }).eq('id', runId);
        }
    }

    /**
     * Submit a approval decision manually.
     */
    static async submitDecision(runId: string, nodeId: string, userId: string, decision: 'approved' | 'rejected', remarks: string) {
        try {
            console.log(`[WorkflowService] Decision on run ${runId} node ${nodeId} by user ${userId}: ${decision}`);

            // Update pending approval request
            const { data: req, error: reqError } = await supabase
                .from('approval_requests')
                .update({
                    status: decision === 'approved' ? 'approved' : 'rejected',
                    remarks,
                    decided_at: new Date().toISOString(),
                    decided_by: userId
                })
                .eq('workflow_run_id', runId)
                .eq('node_id', nodeId)
                .eq('status', 'pending')
                .select()
                .single();

            if (reqError) throw new Error("No pending approval request matches parameters");

            // Complete related tasks
            await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('related_entity_id', req.workflow_run_id) // Match entity ID link
                .eq('status', 'pending');

            // Log choice to run history
            await this.logAudit(runId, nodeId, decision === 'approved' ? 'approved' : 'rejected', userId, remarks);

            const { data: run } = await supabase.from('workflow_runs').select('*, workflow_versions(*)').eq('id', runId).single();
            if (!run) throw new Error("Workflow run record not found");

            const entityType = run.entity_type;
            const { data: entity } = await supabase.from(entityType + 's').select('*').eq('id', run.entity_id).single();

            if (decision === 'approved') {
                // Return run to active tracking and proceed
                await supabase.from('workflow_runs').update({ status: 'running' }).eq('id', runId);
                const nextNodeId = this.getNextNode(run.workflow_versions.connections, nodeId);
                if (nextNodeId) {
                    await this.executeNode(runId, nextNodeId, entity, userId);
                } else {
                    await this.completeRun(runId, userId);
                }
            } else {
                // Workflows terminated on rejection
                await supabase.from('workflow_runs').update({ status: 'cancelled' }).eq('id', runId);
                await this.logAudit(runId, nodeId, 'cancelled', userId, 'Workflow terminated due to rejection step');
            }

            return { success: true };
        } catch (e: any) {
            console.error("[WorkflowService] submitDecision Error:", e.message);
            throw e;
        }
    }

    /**
     * Action dispatch logic.
     */
    private static async runActionBlock(runId: string, action: any, entity: any) {
        console.log(`[WorkflowService] Dispatching Action: ${action.action_type}`);
        const config = action.action_config || {};

        switch (action.action_type) {
            case 'create_task': {
                await supabase.from('tasks').insert({
                    title: config.title || 'Workflow Action Task',
                    description: config.description || '',
                    assigned_role: config.role || 'STAFF',
                    priority: config.priority || 'medium',
                    status: 'pending'
                });
                break;
            }
            case 'webhook': {
                // Mock webhook trigger
                console.log(`[Webhook Action] Posting payload to url ${config.url}`);
                break;
            }
            default:
                console.warn(`[WorkflowService] Unresolved action type matching: ${action.action_type}`);
        }
    }

    private static getNextNode(connections: any[], sourceNodeId: string): string | null {
        const edge = connections.find((c: any) => c.source === sourceNodeId);
        return edge ? edge.target : null;
    }

    private static getNextNodeForCondition(connections: any[], sourceNodeId: string, outcome: boolean): string | null {
        const handleStr = outcome ? 'true' : 'false';
        const edge = connections.find((c: any) => c.source === sourceNodeId && (c.sourceHandle === handleStr || c.label === handleStr));
        return edge ? edge.target : this.getNextNode(connections, sourceNodeId); // Fallback
    }

    private static async completeRun(runId: string, performedBy?: string) {
        await supabase.from('workflow_runs').update({ status: 'completed' }).eq('id', runId);
        await this.logAudit(runId, undefined, 'completed', performedBy, 'Workflow executed successfully to completion node');
        console.log(`[WorkflowService] Run ID ${runId} marked COMPLETED`);
    }

    private static async logAudit(runId: string, nodeId: string | undefined, action: string, userId: string | undefined, remarks: string) {
        await supabase.from('workflow_logs').insert({
            workflow_run_id: runId,
            node_id: nodeId,
            action_taken: action,
            performed_by: userId,
            remarks
        });
    }

    private static interpolateTemplate(template: string, obj: any): string {
        return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
            const val = RuleEvaluator.resolvePath(obj, path.trim());
            return val !== undefined ? String(val) : `{{${path}}}`;
        });
    }

    /**
     * Clone workflow configuration definitions.
     */
    static async cloneWorkflow(workflowId: string, newName: string, newCode: string) {
        const { data: wf } = await supabase.from('workflows').select('*').eq('id', workflowId).single();
        if (!wf) throw new Error("Source workflow not found");

        const { data: newWf } = await supabase
            .from('workflows')
            .insert({ name: newName, code: newCode, description: wf.description, is_template: false })
            .select()
            .single();

        const { data: versions } = await supabase.from('workflow_versions').select('*').eq('workflow_id', workflowId);
        if (versions) {
            for (const ver of versions) {
                const { data: newVer } = await supabase
                    .from('workflow_versions')
                    .insert({
                        workflow_id: newWf.id,
                        version: ver.version,
                        status: 'draft', // Clone defaults to draft status
                        nodes: ver.nodes,
                        connections: ver.connections
                    })
                    .select()
                    .single();

                // Duplicate steps
                const { data: steps } = await supabase.from('workflow_steps').select('*').eq('version_id', ver.id);
                if (steps && steps.length > 0) {
                    await supabase.from('workflow_steps').insert(steps.map(s => ({
                        version_id: newVer.id,
                        node_id: s.node_id,
                        name: s.name,
                        role_required: s.role_required,
                        sequence_order: s.sequence_order,
                        sla_warning_hours: s.sla_warning_hours,
                        sla_escalation_hours: s.sla_escalation_hours,
                        escalation_role: s.escalation_role
                    })));
                }

                // Duplicate conditions
                const { data: conds } = await supabase.from('workflow_conditions').select('*').eq('version_id', ver.id);
                if (conds && conds.length > 0) {
                    await supabase.from('workflow_conditions').insert(conds.map(c => ({
                        version_id: newVer.id,
                        node_id: c.node_id,
                        rules_config: c.rules_config
                    })));
                }

                // Duplicate variables
                const { data: vars } = await supabase.from('workflow_variables').select('*').eq('workflow_version_id', ver.id);
                if (vars && vars.length > 0) {
                    await supabase.from('workflow_variables').insert(vars.map(v => ({
                        workflow_version_id: newVer.id,
                        variable_name: v.variable_name,
                        variable_type: v.variable_type,
                        default_value: v.default_value,
                        scope: v.scope,
                        is_required: v.is_required
                    })));
                }
            }
        }

        return newWf;
    }
}
