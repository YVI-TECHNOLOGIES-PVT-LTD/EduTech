"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionSearchRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionSearchRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_question_bank');
    }
    async searchQuestions(schoolId, filters) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
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
        if (filters.questionType)
            query = query.eq('question_type', filters.questionType);
        if (filters.creatorId)
            query = query.eq('created_by', filters.creatorId);
        // Filter dates
        if (filters.startDate)
            query = query.gte('created_at', filters.startDate);
        if (filters.endDate)
            query = query.lte('created_at', filters.endDate);
        // Search text Vector
        if (filters.search) {
            query = query.textSearch('search_vector', filters.search, { config: 'english' });
        }
        // Sorting
        const sortBy = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        // Range Pagination
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return {
            data: data || [],
            totalCount: count || 0
        };
    }
}
exports.QuestionSearchRepository = QuestionSearchRepository;
exports.default = QuestionSearchRepository;
