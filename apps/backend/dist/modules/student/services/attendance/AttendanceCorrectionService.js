"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCorrectionService = void 0;
const AttendanceCorrection_1 = require("../../domain/attendance/AttendanceCorrection");
class AttendanceCorrectionService {
    constructor(attendanceRepo, stateMachine, auditService) {
        this.attendanceRepo = attendanceRepo;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
    }
    async requestCorrection(attendanceId, requestedStatus, reason, performedBy, correlationId) {
        const correction = new AttendanceCorrection_1.AttendanceCorrection(crypto.randomUUID(), attendanceId, requestedStatus, reason, 'PENDING', null, null, new Date());
        await this.attendanceRepo.saveCorrection(correction);
        await this.auditService.logAudit({
            action: 'STUDENT_ATTENDANCE_CORRECTION_REQUESTED',
            entityName: 'student_attendance_corrections',
            entityId: correction.id,
            afterState: { requestedStatus, reason },
            userId: performedBy,
            correlationId
        });
        return correction;
    }
    async approveCorrection(correctionId, role, processedBy, correlationId) {
        const correction = await this.attendanceRepo.findCorrectionById(correctionId);
        if (!correction) {
            throw new Error(`Correction Request ID ${correctionId} not found`);
        }
        await this.stateMachine.validateTransition(correction.status, 'APPROVED', role);
        const attendance = await this.attendanceRepo.findById(correction.attendanceId);
        if (!attendance) {
            throw new Error('Attendance record not found');
        }
        const oldStatus = attendance.status;
        await this.attendanceRepo.logStatusChange({
            attendance_id: attendance.id,
            old_status: oldStatus,
            new_status: correction.requestedStatus,
            changed_by: processedBy,
            reason: `Correction approved: ${correction.reason}`
        });
        attendance.transitionStatus(correction.requestedStatus);
        await this.attendanceRepo.save(attendance);
        correction.approve(processedBy);
        await this.attendanceRepo.saveCorrection(correction);
        await this.auditService.logAudit({
            action: 'STUDENT_ATTENDANCE_CORRECTION_APPROVED',
            entityName: 'student_attendance_corrections',
            entityId: correctionId,
            afterState: { status: 'APPROVED' },
            userId: processedBy,
            correlationId
        });
    }
}
exports.AttendanceCorrectionService = AttendanceCorrectionService;
