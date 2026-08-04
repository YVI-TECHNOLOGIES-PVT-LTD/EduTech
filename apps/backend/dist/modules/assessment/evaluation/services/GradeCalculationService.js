"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeCalculationService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const GradeCalculationRepository_1 = require("../repositories/GradeCalculationRepository");
const supabase_1 = require("../../../../config/supabase");
class GradeCalculationService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new GradeCalculationRepository_1.GradeCalculationRepository();
    }
    async calculateGrade(schoolId, attemptId, userId, correlationId) {
        this.logInfo(`Calculating finalized grade structure for attempt: ${attemptId}`, correlationId);
        // Fetch question evaluations for this attempt
        const { data: evaluations, error: evalErr } = await supabase_1.supabase
            .from('assessment_question_evaluations')
            .select('awarded_marks, maximum_marks, session:assessment_evaluation_sessions!inner(*)')
            .eq('session.attempt_id', attemptId);
        if (evalErr)
            throw evalErr;
        let totalRawMarks = 0;
        let totalMaxMarks = 0;
        for (const ev of evaluations || []) {
            totalRawMarks += Number(ev.awarded_marks);
            totalMaxMarks += Number(ev.maximum_marks);
        }
        // Apply grace marks bonus limits (mock checks)
        let graceMarksApplied = 0.00;
        if (totalRawMarks < 40.00 && totalRawMarks >= 38.00) {
            // Apply 2.00 grace marks to pass
            graceMarksApplied = 2.00;
        }
        const finalMarks = totalRawMarks + graceMarksApplied;
        const pct = totalMaxMarks > 0 ? (finalMarks / totalMaxMarks) * 100.00 : 0.00;
        // Map percentage to grade label and GPA grade point
        let gradeLabel = 'F';
        let gradePoint = 0.00;
        if (pct >= 90.00) {
            gradeLabel = 'O';
            gradePoint = 10.00;
        }
        else if (pct >= 80.00) {
            gradeLabel = 'A+';
            gradePoint = 9.00;
        }
        else if (pct >= 70.00) {
            gradeLabel = 'A';
            gradePoint = 8.00;
        }
        else if (pct >= 60.00) {
            gradeLabel = 'B+';
            gradePoint = 7.00;
        }
        else if (pct >= 50.00) {
            gradeLabel = 'B';
            gradePoint = 6.00;
        }
        else if (pct >= 40.00) {
            gradeLabel = 'C';
            gradePoint = 5.00;
        }
        const payload = {
            attempt_id: attemptId,
            raw_marks: totalRawMarks,
            scaled_marks: finalMarks,
            grace_marks: graceMarksApplied,
            final_marks: finalMarks,
            grade_label: gradeLabel,
            grade_point: gradePoint,
            credits: 4 // Mock baseline credits course allocation value
        };
        return this.repo.saveCalculation(schoolId, payload, userId);
    }
}
exports.GradeCalculationService = GradeCalculationService;
exports.default = GradeCalculationService;
