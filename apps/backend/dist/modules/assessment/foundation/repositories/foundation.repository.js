"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoundationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class FoundationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_configurations');
    }
    /**
     * Resolves configuration for a school tenant, automatically seeding defaults if absent.
     */
    async findConfigBySchool(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        if (data)
            return data;
        // Seed default config on-demand if not found
        const { data: newConfig, error: insertError } = await supabase_1.supabase
            .from(this.tableName)
            .insert({ school_id: schoolId })
            .select()
            .single();
        if (insertError)
            throw insertError;
        return newConfig;
    }
    /**
     * Updates tenant configuration with optimistic locking/version checks.
     */
    async updateConfig(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Lists active workflows for a school.
     */
    async listWorkflows(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from('assessment_workflow_definitions')
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .order('name', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    /**
     * Finds a single workflow including nested steps and transitions.
     */
    async findWorkflowById(workflowId, schoolId) {
        const { data: definition, error: defError } = await supabase_1.supabase
            .from('assessment_workflow_definitions')
            .select('*')
            .eq('id', workflowId)
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (defError)
            throw defError;
        if (!definition)
            return null;
        const { data: steps, error: stepsError } = await supabase_1.supabase
            .from('assessment_workflow_steps')
            .select('*')
            .eq('workflow_id', workflowId)
            .order('sort_order', { ascending: true });
        if (stepsError)
            throw stepsError;
        const { data: transitions, error: transError } = await supabase_1.supabase
            .from('assessment_workflow_transitions')
            .select('*')
            .eq('workflow_id', workflowId);
        if (transError)
            throw transError;
        return {
            ...definition,
            steps: steps || [],
            transitions: transitions || []
        };
    }
    /**
     * Atomic transaction creation of a workflow with nested steps and transitions.
     */
    async createWorkflow(schoolId, payload) {
        const { steps, transitions, ...definitionPayload } = payload;
        // 1. Insert Definition
        const { data: definition, error: defError } = await supabase_1.supabase
            .from('assessment_workflow_definitions')
            .insert({
            ...definitionPayload,
            school_id: schoolId
        })
            .select()
            .single();
        if (defError)
            throw defError;
        // 2. Insert Steps
        if (steps && steps.length > 0) {
            const stepsPayload = steps.map((step) => ({
                ...step,
                workflow_id: definition.id
            }));
            const { error: stepsError } = await supabase_1.supabase
                .from('assessment_workflow_steps')
                .insert(stepsPayload);
            if (stepsError)
                throw stepsError;
        }
        // 3. Insert Transitions
        if (transitions && transitions.length > 0) {
            const transPayload = transitions.map((trans) => ({
                ...trans,
                workflow_id: definition.id
            }));
            const { error: transError } = await supabase_1.supabase
                .from('assessment_workflow_transitions')
                .insert(transPayload);
            if (transError)
                throw transError;
        }
        return this.findWorkflowById(definition.id, schoolId);
    }
    /**
     * Atomic update of a workflow, clearing and rewriting steps/transitions.
     */
    async updateWorkflow(workflowId, schoolId, payload) {
        const { steps, transitions, ...definitionPayload } = payload;
        // 1. Update Definition
        const { data: definition, error: defError } = await supabase_1.supabase
            .from('assessment_workflow_definitions')
            .update({
            ...definitionPayload,
            updated_at: new Date().toISOString()
        })
            .eq('id', workflowId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (defError)
            throw defError;
        // 2. Refresh Steps
        if (steps) {
            const { error: deleteStepsError } = await supabase_1.supabase
                .from('assessment_workflow_steps')
                .delete()
                .eq('workflow_id', workflowId);
            if (deleteStepsError)
                throw deleteStepsError;
            if (steps.length > 0) {
                const stepsPayload = steps.map((step) => ({
                    step_name: step.step_name,
                    role_required: step.role_required,
                    sort_order: step.sort_order,
                    workflow_id: workflowId
                }));
                const { error: stepsError } = await supabase_1.supabase
                    .from('assessment_workflow_steps')
                    .insert(stepsPayload);
                if (stepsError)
                    throw stepsError;
            }
        }
        // 3. Refresh Transitions
        if (transitions) {
            const { error: deleteTransError } = await supabase_1.supabase
                .from('assessment_workflow_transitions')
                .delete()
                .eq('workflow_id', workflowId);
            if (deleteTransError)
                throw deleteTransError;
            if (transitions.length > 0) {
                const transPayload = transitions.map((trans) => ({
                    from_status: trans.from_status,
                    to_status: trans.to_status,
                    rule_condition: trans.rule_condition || null,
                    workflow_id: workflowId
                }));
                const { error: transError } = await supabase_1.supabase
                    .from('assessment_workflow_transitions')
                    .insert(transPayload);
                if (transError)
                    throw transError;
            }
        }
        return this.findWorkflowById(workflowId, schoolId);
    }
    /**
     * Soft deletes a workflow definition.
     */
    async deleteWorkflow(workflowId, schoolId, userId) {
        const { error } = await supabase_1.supabase
            .from('assessment_workflow_definitions')
            .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: userId
        })
            .eq('id', workflowId)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
}
exports.FoundationRepository = FoundationRepository;
