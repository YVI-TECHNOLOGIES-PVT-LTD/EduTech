"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStepRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class WorkflowStepRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_workflow_steps');
    }
    async findByWorkflowId(workflowId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('workflow_id', workflowId)
            .order('sort_order', { ascending: true });
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
    async createBulk(steps) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(steps)
            .select();
        if (error)
            throw error;
        return data || [];
    }
    async create(step) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(step)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, step) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update(step)
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
exports.WorkflowStepRepository = WorkflowStepRepository;
