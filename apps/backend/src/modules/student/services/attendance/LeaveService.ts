import { LeaveRepository } from '../../repositories/attendance/LeaveRepository';
import { AttendanceValidationCoordinator } from './validators/AttendanceValidationCoordinator';
import { LeaveRequest } from '../../domain/attendance/LeaveRequest';
import { AuditService } from '../../../admission/services/AuditService';

export class LeaveService {
    constructor(
        private readonly leaveRepo: LeaveRepository,
        private readonly validationCoordinator: AttendanceValidationCoordinator,
        private readonly auditService: AuditService
    ) {}

    public async submitLeave(
        studentId: string,
        leaveTypeId: string,
        startDate: Date,
        endDate: Date,
        reason: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<LeaveRequest> {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        await this.validationCoordinator.validateLeaveApplication(
            studentId,
            leaveTypeId,
            requestedDays
        );

        const request = new LeaveRequest(
            crypto.randomUUID(),
            studentId,
            leaveTypeId,
            startDate,
            endDate,
            reason,
            'SUBMITTED',
            new Date(),
            new Date()
        );
        await this.leaveRepo.saveRequest(request);

        await this.auditService.logAudit({
            action: 'STUDENT_LEAVE_SUBMITTED',
            entityName: 'student_leave_requests',
            entityId: request.id,
            afterState: { requestedDays, reason },
            userId: performedBy,
            correlationId
        });

        return request;
    }
}
