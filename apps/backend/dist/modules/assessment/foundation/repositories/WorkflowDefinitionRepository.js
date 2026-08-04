"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDefinitionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class WorkflowDefinitionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_workflow_definitions');
    }
    async listAll(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async findById(id, schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async create(payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async softDelete(id, schoolId, userId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: userId
        })
            .eq('id', id)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
}
exports.WorkflowDefinitionRepository = WorkflowDefinitionRepository;
