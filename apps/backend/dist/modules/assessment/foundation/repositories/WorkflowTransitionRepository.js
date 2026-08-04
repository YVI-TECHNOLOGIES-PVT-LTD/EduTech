"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowTransitionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class WorkflowTransitionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_workflow_transitions');
    }
    async findByWorkflowId(workflowId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('workflow_id', workflowId);
        if (error)
            throw error;
        return data || [];
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async createBulk(transitions) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(transitions)
            .select();
        if (error)
            throw error;
        return data || [];
    }
    async create(transition) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(transition)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, transition) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update(transition)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    async deleteByWorkflowId(workflowId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('workflow_id', workflowId);
        if (error)
            throw error;
    }
}
exports.WorkflowTransitionRepository = WorkflowTransitionRepository;
