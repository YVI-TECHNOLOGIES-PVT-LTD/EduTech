import { supabase } from '../config/supabase';
import { NotificationService } from './NotificationService';

export class WorkflowScheduler {
    
    /**
     * Periodically scanned by cron runner or interval loop triggers.
     * Evaluates SLA deadlines, warning limits, and escalations.
     */
    static async checkSLAs() {
        console.log('[WorkflowScheduler] Checking SLAs and escalations across pending approvals...');
        try {
            // 1. Fetch pending approvals and step definitions details
            const { data: pendingRequests } = await supabase
                .from('approval_requests')
                .select(`
                    *,
                    workflow_run:workflow_run_id (
                        *,
                        workflow_versions (
                            *
                        )
                    )
                `)
                .eq('status', 'pending');

            if (!pendingRequests || pendingRequests.length === 0) {
                console.log('[WorkflowScheduler] No pending approvals to monitor.');
                return;
            }

            const now = new Date();

            for (const req of pendingRequests) {
                const ver = req.workflow_run?.workflow_versions;
                if (!ver) continue;

                // Match step sequence definitions
                const step = ver.nodes.find((n: any) => n.id === req.node_id);
                if (!step) continue;

                const slaWarningHrs = step.data?.sla_warning_hours || 24;
                const slaEscalateHrs = step.data?.sla_escalation_hours || 48;
                const escalationRole = step.data?.escalation_role || 'PRINCIPAL';

                const createdAtDate = new Date(req.created_at);
                const hrsDiff = (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60);

                // Warning Escalation Trigger
                if (hrsDiff >= slaWarningHrs && !req.metadata?.warning_sent) {
                    console.log(`[WorkflowScheduler] Warning Triggered for Run ID: ${req.workflow_run_id} Node ID: ${req.node_id}`);
                    
                    // Update request metadata log
                    const updatedMeta = { ...(req.metadata || {}), warning_sent: true };
                    await supabase
                        .from('approval_requests')
                        .update({ metadata: updatedMeta })
                        .eq('id', req.id);

                    // Send notifications alerts
                    if (req.assigned_user_id) {
                        await NotificationService.send(
                            req.assigned_user_id,
                            "SLA WARNING: Task Pending Review",
                            `Your approval task "${step.data?.label || 'Step'}" is pending more than ${slaWarningHrs} hours.`
                        );
                    }
                }

                // Hard Escalation Trigger
                if (hrsDiff >= slaEscalateHrs && req.workflow_run.status !== 'escalated') {
                    console.log(`[WorkflowScheduler] Hard Escalation Triggered for Run ID: ${req.workflow_run_id}`);

                    // Escalates Run
                    await supabase
                        .from('workflow_runs')
                        .update({ status: 'escalated' })
                        .eq('id', req.workflow_run_id);

                    // Re-assign Pending Requests and Tasks
                    await supabase
                        .from('approval_requests')
                        .update({ assigned_role: escalationRole })
                        .eq('id', req.id);

                    await supabase
                        .from('tasks')
                        .update({
                            title: `ESCALATED: ${step.data?.label || 'Task'}`,
                            assigned_role: escalationRole,
                            priority: 'critical'
                        })
                        .eq('related_entity_id', req.workflow_run_id)
                        .eq('status', 'pending');

                    // Audit timeline logging
                    await supabase.from('workflow_logs').insert({
                        workflow_run_id: req.workflow_run_id,
                        node_id: req.node_id,
                        action_taken: 'escalated',
                        remarks: `Escalated to role ${escalationRole} due to SLA breach exceeding ${slaEscalateHrs} hours.`
                    });
                }
            }
        } catch (e: any) {
            console.error('[WorkflowScheduler] checkSLAs Error:', e.message);
        }
    }
}
