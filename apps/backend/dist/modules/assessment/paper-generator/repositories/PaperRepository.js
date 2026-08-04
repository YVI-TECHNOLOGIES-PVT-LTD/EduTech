"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PaperRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_papers');
    }
    async listPapers(schoolId, filters) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
        if (filters.subjectId)
            query = query.eq('subject_id', filters.subjectId);
        if (filters.status)
            query = query.eq('status', filters.status);
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
    async findPaperById(paperId, schoolId) {
        const { data: paper, error: pError } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', paperId)
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (pError)
            throw pError;
        if (!paper)
            return null;
        // Sections
        const { data: sections, error: sError } = await supabase_1.supabase
            .from('assessment_generated_sections')
            .select('*')
            .eq('paper_id', paperId)
            .order('sort_order', { ascending: true });
        if (sError)
            throw sError;
        const sectionIds = (sections || []).map(s => s.id);
        let questions = [];
        if (sectionIds.length > 0) {
            const { data: qData, error: qError } = await supabase_1.supabase
                .from('assessment_generated_questions')
                .select('*, question:assessment_question_bank(*)')
                .in('section_id', sectionIds)
                .order('sort_order', { ascending: true });
            if (qError)
                throw qError;
            questions = qData || [];
        }
        const enrichedSections = (sections || []).map(sec => ({
            ...sec,
            questions: questions.filter(q => q.section_id === sec.id).map(q => ({
                id: q.id,
                sort_order: q.sort_order,
                question: q.question
            }))
        }));
        // Validation logs
        const { data: validationLogs, error: valError } = await supabase_1.supabase
            .from('assessment_generated_validation_logs')
            .select('*')
            .eq('paper_id', paperId)
            .order('validated_at', { ascending: false });
        if (valError)
            throw valError;
        // Stats
        const { data: stats, error: statError } = await supabase_1.supabase
            .from('assessment_generated_statistics')
            .select('*')
            .eq('paper_id', paperId)
            .maybeSingle();
        if (statError)
            throw statError;
        return {
            ...paper,
            sections: enrichedSections,
            validationLogs: validationLogs || [],
            statistics: stats || null
        };
    }
    async createPaper(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...payload,
            school_id: schoolId,
            status: 'DRAFT',
            version: 1
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updatePaper(paperId, schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
            .eq('id', paperId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deletePaper(paperId, schoolId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            is_deleted: true,
            updated_at: new Date().toISOString()
        })
            .eq('id', paperId)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
}
exports.PaperRepository = PaperRepository;
exports.default = PaperRepository;
