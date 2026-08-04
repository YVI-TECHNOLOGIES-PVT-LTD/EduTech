"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevaluationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class RevaluationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_revaluation_requests');
    }
    async listRequests(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async createRequest(attemptId, studentId, reason) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            attempt_id: attemptId,
            student_id: studentId,
            reason,
            status: 'REQUESTED'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateStatus(requestId, status, remarks) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            status,
            decision_remarks: remarks || null
        })
            .eq('id', requestId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.RevaluationRepository = RevaluationRepository;
exports.default = RevaluationRepository;
