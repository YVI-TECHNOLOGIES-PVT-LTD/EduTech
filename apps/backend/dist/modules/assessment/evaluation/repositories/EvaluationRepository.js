"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class EvaluationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_evaluation_sessions');
    }
    async listSessions(schoolId, status) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*, assignment:assessment_evaluation_assignments(*)')
            .eq('school_id', schoolId);
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return data || [];
    }
    async findSessionById(sessionId, schoolId) {
        const { data: session, error: sErr } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', sessionId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (sErr)
            throw sErr;
        if (!session)
            return null;
        // Fetch question evaluations
        const { data: questionEvaluations, error: qErr } = await supabase_1.supabase
            .from('assessment_question_evaluations')
            .select('*')
            .eq('session_id', sessionId);
        if (qErr)
            throw qErr;
        const evaluatedIds = (questionEvaluations || []).map(qe => qe.id);
        let annotations = [];
        if (evaluatedIds.length > 0) {
            const { data: annData, error: annErr } = await supabase_1.supabase
                .from('assessment_evaluation_annotations')
                .select('*')
                .in('question_evaluation_id', evaluatedIds);
            if (annErr)
                throw annErr;
            annotations = annData || [];
        }
        const enrichedEvaluations = (questionEvaluations || []).map(qe => ({
            ...qe,
            annotations: annotations.filter(ann => ann.question_evaluation_id === qe.id)
        }));
        return {
            ...session,
            questionEvaluations: enrichedEvaluations
        };
    }
    async createSession(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...payload,
            school_id: schoolId,
            status: 'DRAFT'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateSessionStatus(sessionId, status) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            status,
            completed_at: status === 'LOCKED' ? new Date().toISOString() : null
        })
            .eq('id', sessionId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async saveQuestionEvaluation(sessionId, payload, userId) {
        // Upsert question evaluation score
        const { data: existing } = await supabase_1.supabase
            .from('assessment_question_evaluations')
            .select('id')
            .eq('session_id', sessionId)
            .eq('question_snapshot_id', payload.question_snapshot_id)
            .maybeSingle();
        let result;
        if (existing) {
            const { data, error } = await supabase_1.supabase
                .from('assessment_question_evaluations')
                .update({
                awarded_marks: payload.awarded_marks,
                remarks: payload.remarks,
                evaluator_id: userId,
                evaluated_at: new Date().toISOString()
            })
                .eq('id', existing.id)
                .select()
                .single();
            if (error)
                throw error;
            result = data;
        }
        else {
            const { data, error } = await supabase_1.supabase
                .from('assessment_question_evaluations')
                .insert({
                session_id: sessionId,
                question_snapshot_id: payload.question_snapshot_id,
                awarded_marks: payload.awarded_marks,
                maximum_marks: payload.maximum_marks,
                remarks: payload.remarks,
                evaluator_id: userId
            })
                .select()
                .single();
            if (error)
                throw error;
            result = data;
        }
        // Save annotations if provided
        if (payload.annotations && payload.annotations.length > 0) {
            // Clear existing annotations for this question evaluation
            await supabase_1.supabase
                .from('assessment_evaluation_annotations')
                .delete()
                .eq('question_evaluation_id', result.id);
            const annPayload = payload.annotations.map((ann) => ({
                question_evaluation_id: result.id,
                type: ann.type,
                coordinates: ann.coordinates,
                comment_text: ann.comment_text,
                annotated_by: userId
            }));
            const { error: annErr } = await supabase_1.supabase
                .from('assessment_evaluation_annotations')
                .insert(annPayload);
            if (annErr)
                throw annErr;
        }
        return result;
    }
}
exports.EvaluationRepository = EvaluationRepository;
exports.default = EvaluationRepository;
