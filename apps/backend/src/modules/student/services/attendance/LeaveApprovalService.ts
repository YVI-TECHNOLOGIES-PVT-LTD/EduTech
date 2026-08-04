import { LeaveRepository } from '../../repositories/attendance/LeaveRepository';
import { LeaveApproval } from '../../domain/attendance/LeaveApproval';
import { LeaveStateMachine } from './state-machine/LeaveStateMachine';
import { AuditService } from '../../../admission/services/AuditService';

export class LeaveApprovalService {
    constructor(
        private readonly leaveRepo: LeaveRepository,
        private readonly stateMachine: LeaveStateMachine,
        private readonly auditService: AuditService
    ) {}

    public async approveLeave(
        requestId: string,
        remarks: string | null,
        approvedBy: string | null,
        correlationId?: string
    ): Promise<void> {
        const req = await this.leaveRepo.findRequestById(requestId);
        if (!req) {
            throw new Error(`Leave Request ID ${requestId} not found`);
        }

        this.stateMachine.validateTransition(req.status, 'APPROVED');

        req.transitionStatus('APPROVED');
        await this.leaveRepo.saveRequest(req);

        const approval = new LeaveApproval(
            crypto.randomUUID(),
            requestId,
            approvedBy,
            new Date(),
            remarks
        );
        await this.leaveRepo.saveApproval(approval);

        await this.auditService.logAudit({
            action: 'STUDENT_LEAVE_APPROVED',
            entityName: 'student_leave_requests',
            entityId: requestId,
            afterState: { status: 'APPROVED', remarks },
            userId: approvedBy,
            correlationId
        });
    }
}
