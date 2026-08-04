import { AttendanceRepository } from '../../repositories/attendance/AttendanceRepository';
import { StudentRepository } from '../../repositories/StudentRepository';
import { AttendanceValidationCoordinator } from './validators/AttendanceValidationCoordinator';
import { Attendance, AttendanceStatus } from '../../domain/attendance/Attendance';
import { AuditService } from '../../../admission/services/AuditService';

export class AttendanceService {
    constructor(
        private readonly attendanceRepo: AttendanceRepository,
        private readonly studentRepo: StudentRepository,
        private readonly validationCoordinator: AttendanceValidationCoordinator,
        private readonly auditService: AuditService
    ) {}

    public async markAttendance(
        sessionId: string,
        studentId: string,
        status: AttendanceStatus,
        remarks: string | null,
        markedBy: string | null,
        correlationId?: string
    ): Promise<Attendance> {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session) {
            throw new Error(`Attendance Session ID ${sessionId} not found`);
        }

        await this.validationCoordinator.validateDailyMarking(
            studentId,
            session.schoolId,
            session.date,
            sessionId
        );

        const attendance = new Attendance(
            crypto.randomUUID(),
            sessionId,
            studentId,
            status,
            remarks,
            markedBy,
            new Date(),
            new Date()
        );
        await this.attendanceRepo.save(attendance);

        await this.auditService.logAudit({
            action: 'STUDENT_ATTENDANCE_MARKED',
            entityName: 'student_attendance',
            entityId: attendance.id,
            afterState: { status },
            userId: markedBy,
            correlationId
        });

        return attendance;
    }

    public async bulkMark(
        sessionId: string,
        records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>,
        markedBy: string | null,
        correlationId?: string
    ): Promise<void> {
        for (const item of records) {
            try {
                await this.markAttendance(
                    sessionId,
                    item.studentId,
                    item.status,
                    item.remarks || null,
                    markedBy,
                    correlationId
                );
            } catch (err: any) {
                if (!err.message.includes('already been marked') && !err.message.includes('holiday')) {
                    throw err;
                }
            }
        }
    }
}
