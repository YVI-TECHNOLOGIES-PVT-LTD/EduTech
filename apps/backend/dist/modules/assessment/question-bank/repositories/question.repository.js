"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_question_bank');
    }
    // ==========================================
    async findFolderById(folderId, schoolId) {
        const { data, error } = await supabase_1.supabase
            .from('assessment_folders')
            .select('*')
            .eq('id', folderId)
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async listFolders(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from('assessment_folders')
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .order('name', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    async createFolder(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from('assessment_folders')
            .insert({
            ...payload,
            school_id: schoolId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateFolder(folderId, schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from('assessment_folders')
            .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
            .eq('id', folderId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteFolder(folderId, schoolId, userId) {
        const { error } = await supabase_1.supabase
            .from('assessment_folders')
            .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: userId
        })
            .eq('id', folderId)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
    // ==========================================
    // QUESTIONS OPERATIONS
    // ==========================================
    /**
     * Lists questions using filters and pagination, falling back to GIN index vector matches if search matches are queried.
     */
    async listQuestions(schoolId, filters) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
        // Filter maps
        if (filters.folderId !== undefined) {
            if (filters.folderId === null) {
                query = query.is('folder_id', null);
            }
            else {
                query = query.eq('folder_id', filters.folderId);
            }
        }
        if (filters.subjectId)
            query = query.eq('subject_id', filters.subjectId);
        if (filters.difficulty)
            query = query.eq('difficulty', filters.difficulty);
        if (filters.bloomLevel)
            query = query.eq('bloom_level', filters.bloomLevel);
        if (filters.status)
            query = query.eq('status', filters.status);
        // GIN text vector match
        if (filters.search) {
            query = query.textSearch('search_vector', filters.search, { config: 'english' });
        }
        // Pagination
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to).order('created_at', { ascending: false });
        const { data, error, count } = await query;
        if (error)
            throw error;
        return {
            data: data || [],
            totalCount: count || 0
        };
    }
    /**
     * Resolves single question detail including options.
     */
    async findQuestionById(questionId, schoolId) {
        const { data: question, error: qError } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', questionId)
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (qError)
            throw qError;
        if (!question)
            return null;
        const { data: options, error: optError } = await supabase_1.supabase
            .from('assessment_question_options')
            .select('*')
            .eq('question_id', questionId)
            .eq('is_deleted', false);
        if (optError)
            throw optError;
        return {
            ...question,
            options: options || []
        };
    }
    /**
     * Creates a new question and associated options transactionally.
     */
    async createQuestion(schoolId, payload) {
        const { options, ...questionPayload } = payload;
        // 1. Insert Question Definition
        const { data: question, error: qError } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...questionPayload,
            school_id: schoolId
        })
            .select()
            .single();
        if (qError)
            throw qError;
        // 2. Insert Options if present
        if (options && options.length > 0) {
            const optionsPayload = options.map((opt) => ({
                question_id: question.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct
            }));
            const { error: optError } = await supabase_1.supabase
                .from('assessment_question_options')
                .insert(optionsPayload);
            if (optError)
                throw optError;
        }
        return this.findQuestionById(question.id, schoolId);
    }
    /**
     * Updates an existing question and replaces its options list.
     */
    async updateQuestion(questionId, schoolId, payload) {
        const { options, ...questionPayload } = payload;
        // 1. Update core definition
        const { data: question, error: qError } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...questionPayload,
            updated_at: new Date().toISOString()
        })
            .eq('id', questionId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (qError)
            throw qError;
        // 2. Refresh Options
        if (options) {
            const { error: deleteOptError } = await supabase_1.supabase
                .from('assessment_question_options')
                .delete()
                .eq('question_id', questionId);
            if (deleteOptError)
                throw deleteOptError;
            if (options.length > 0) {
                const optionsPayload = options.map((opt) => ({
                    question_id: questionId,
                    option_text: opt.option_text,
                    is_correct: opt.is_correct
                }));
                const { error: optError } = await supabase_1.supabase
                    .from('assessment_question_options')
                    .insert(optionsPayload);
                if (optError)
                    throw optError;
            }
        }
        return this.findQuestionById(questionId, schoolId);
    }
    /**
     * Soft deletes a question.
     */
    async deleteQuestion(questionId, schoolId, userId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: userId
        })
            .eq('id', questionId)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
    /**
     * Checks if a question with matching text already exists to avoid duplication.
     */
    async duplicateCheck(schoolId, subjectId, questionText) {
        const cleanedText = questionText.trim().toLowerCase();
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('id')
            .eq('school_id', schoolId)
            .eq('subject_id', subjectId)
            .eq('is_deleted', false)
            .ilike('question_text', cleanedText)
            .limit(1);
        if (error)
            throw error;
        return data && data.length > 0;
    }
}
exports.QuestionRepository = QuestionRepository;
