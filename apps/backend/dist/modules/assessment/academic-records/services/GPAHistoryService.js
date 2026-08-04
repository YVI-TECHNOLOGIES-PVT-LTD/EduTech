"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPAHistoryService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class GPAHistoryService extends BaseService_1.BaseService {
    async recordTermGpa(academicRecordId, termId, gpa, earnedCredits, correlationId) {
        this.logInfo(`Recording term GPA metrics for academic record: ${academicRecordId}`, correlationId);
        const { data, error } = await supabase_1.supabase
            .from('student_academic_terms')
            .insert({
            academic_record_id: academicRecordId,
            term_id: termId,
            gpa,
            earned_credits: earnedCredits
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.GPAHistoryService = GPAHistoryService;
exports.default = GPAHistoryService;
