"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRecordService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const AcademicRecordRepository_1 = require("../repositories/AcademicRecordRepository");
const AcademicSnapshotService_1 = require("./AcademicSnapshotService");
const supabase_1 = require("../../../../config/supabase");
class AcademicRecordService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AcademicRecordRepository_1.AcademicRecordRepository();
        this.snapshotService = new AcademicSnapshotService_1.AcademicSnapshotService();
    }
    async registerPublishedResult(schoolId, studentId, gpa, credits, correlationId) {
        this.logInfo(`Registering published result for student: ${studentId}`, correlationId);
        // Fetch current cumulative record totals
        const { data: current } = await supabase_1.supabase
            .from('student_academic_records')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        const currentCredits = current ? Number(current.total_credits) : 0;
        const currentCgpa = current ? Number(current.cgpa) : 0.00;
        const newTotalCredits = currentCredits + credits;
        const newCgpa = newTotalCredits > 0
            ? ((currentCgpa * currentCredits) + (gpa * credits)) / newTotalCredits
            : gpa;
        const record = await this.repo.saveAcademicRecord(schoolId, {
            student_id: studentId,
            cgpa: newCgpa,
            total_credits: newTotalCredits
        });
        // Log timeline event
        await this.repo.logTimelineEvent(studentId, 'GPA_UPDATED', `Academic CGPA updated to ${newCgpa.toFixed(2)} with total earned credits: ${newTotalCredits}`);
        // Save immutable snapshot backup
        await this.snapshotService.captureSnapshot(record.id, record);
        return record;
    }
}
exports.AcademicRecordService = AcademicRecordService;
exports.default = AcademicRecordService;
