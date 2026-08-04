"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const LeaveRequest_1 = require("../../domain/attendance/LeaveRequest");
class LeaveService {
    constructor(leaveRepo, validationCoordinator, auditService) {
        this.leaveRepo = leaveRepo;
        this.validationCoordinator = validationCoordinator;
        this.auditService = auditService;
    }
    async submitLeave(studentId, leaveTypeId, startDate, endDate, reason, performedBy, correlationId) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        await this.validationCoordinator.validateLeaveApplication(studentId, leaveTypeId, requestedDays);
        const request = new LeaveRequest_1.LeaveRequest(crypto.randomUUID(), studentId, leaveTypeId, startDate, endDate, reason, 'SUBMITTED', new Date(), new Date());
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
exports.LeaveService = LeaveService;
