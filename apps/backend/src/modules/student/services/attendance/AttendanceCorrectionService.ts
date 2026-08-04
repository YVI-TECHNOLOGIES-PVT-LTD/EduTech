import { AttendanceRepository } from '../../repositories/attendance/AttendanceRepository';
import { AttendanceCorrection } from '../../domain/attendance/AttendanceCorrection';
import { AttendanceStateMachine } from './state-machine/AttendanceStateMachine';
import { AuditService } from '../../../admission/services/AuditService';

export class AttendanceCorrectionService {
    constructor(
        private readonly attendanceRepo: AttendanceRepository,
        private readonly stateMachine: AttendanceStateMachine,
        private readonly auditService: AuditService
    ) {}

    public async requestCorrection(
        attendanceId: string,
        requestedStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY',
        reason: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<AttendanceCorrection> {
        const correction = new AttendanceCorrection(
            crypto.randomUUID(),
            attendanceId,
            requestedStatus,
            reason,
            'PENDING',
            null,
            null,
            new Date()
        );
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

    public async approveCorrection(
        correctionId: string,
        role: string,
        processedBy: string | null,
        correlationId?: string
    ): Promise<void> {
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
