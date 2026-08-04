"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
class AttendanceService {
    constructor(examRepo, appRepo, auditService) {
        this.examRepo = examRepo;
        this.appRepo = appRepo;
        this.auditService = auditService;
    }
    async recordAttendance(sessionId, applicationId, status, remarks, performedBy, correlationId) {
        const candidate = await this.examRepo.findCandidate(sessionId, applicationId);
        if (!candidate) {
            throw new Error(`Candidate allocation not found for session ${sessionId} and application ${applicationId}`);
        }
        candidate.attendance_status = status;
        candidate.remarks = remarks || null;
        await this.examRepo.saveCandidate(candidate);
        // Timeline entry
        const timelineEvent = status === 'PRESENT' || status === 'LATE' ? 'EXAM_ATTENDED' : 'EXAM_ABSENT';
        await this.appRepo.logWorkflow(applicationId, timelineEvent, null, 'SUBMITTED', performedBy, `Candidate marked ${status} for entrance exam. Remarks: ${remarks || 'None'}`);
        // Audit Trail log
        await this.auditService.logAudit({
            action: `EXAM_ATTENDANCE_RECORDED_${status}`,
            entityName: 'admission_exam_session_candidates',
            entityId: candidate.id,
            afterState: { attendance: status, remarks },
            userId: performedBy,
            correlationId
        });
    }
}
exports.AttendanceService = AttendanceService;
