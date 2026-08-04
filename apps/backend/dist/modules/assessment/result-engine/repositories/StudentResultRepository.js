"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentResultRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class StudentResultRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_student_results');
    }
    async listResultsBySession(sessionId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*, subject_results:assessment_subject_results(*)')
            .eq('session_id', sessionId);
        if (error)
            throw error;
        return data || [];
    }
    async saveStudentResult(payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            session_id: payload.session_id,
            student_id: payload.student_id,
            raw_marks_sum: payload.raw_marks_sum,
            scaled_marks_sum: payload.scaled_marks_sum,
            grace_marks_sum: payload.grace_marks_sum,
            final_percentage: payload.final_percentage,
            gpa: payload.gpa,
            cgpa: payload.cgpa,
            total_credits: payload.total_credits
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.StudentResultRepository = StudentResultRepository;
exports.default = StudentResultRepository;
