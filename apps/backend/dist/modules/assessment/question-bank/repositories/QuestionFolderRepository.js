"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionFolderRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionFolderRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_folders');
    }
    async findBySchool(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .order('name', { ascending: true });
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
    async create(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({ ...payload, school_id: schoolId })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({ ...payload, updated_at: new Date().toISOString() })
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
    async getFolderStats(schoolId) {
        // Query counts of active questions grouped by folder_id
        const { data, error } = await supabase_1.supabase
            .from('assessment_question_bank')
            .select('folder_id, difficulty, status')
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
        if (error)
            throw error;
        return data || [];
    }
}
exports.QuestionFolderRepository = QuestionFolderRepository;
exports.default = QuestionFolderRepository;
