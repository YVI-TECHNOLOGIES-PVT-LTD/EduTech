"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveApprovalService = void 0;
const LeaveApproval_1 = require("../../domain/attendance/LeaveApproval");
class LeaveApprovalService {
    constructor(leaveRepo, stateMachine, auditService) {
        this.leaveRepo = leaveRepo;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
    }
    async approveLeave(requestId, remarks, approvedBy, correlationId) {
        const req = await this.leaveRepo.findRequestById(requestId);
        if (!req) {
            throw new Error(`Leave Request ID ${requestId} not found`);
        }
        this.stateMachine.validateTransition(req.status, 'APPROVED');
        req.transitionStatus('APPROVED');
        await this.leaveRepo.saveRequest(req);
        const approval = new LeaveApproval_1.LeaveApproval(crypto.randomUUID(), requestId, approvedBy, new Date(), remarks);
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
exports.LeaveApprovalService = LeaveApprovalService;
