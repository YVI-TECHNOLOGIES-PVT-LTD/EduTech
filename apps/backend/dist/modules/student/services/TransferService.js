"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferService = void 0;
const StudentTransfer_1 = require("../domain/StudentTransfer");
class TransferService {
    constructor(transferRepo, studentRepo, validationCoordinator, stateMachine, auditService) {
        this.transferRepo = transferRepo;
        this.studentRepo = studentRepo;
        this.validationCoordinator = validationCoordinator;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
    }
    async requestTransfer(studentId, destinationSchool, reason, performedBy, correlationId) {
        await this.validationCoordinator.validateTransfer(studentId);
        const request = new StudentTransfer_1.StudentTransfer(crypto.randomUUID(), studentId, destinationSchool, reason, new Date(), 'PENDING');
        await this.transferRepo.saveTransferRequest(request);
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'STUDENT_TRANSFER_REQUESTED',
            entityName: 'student_transfer_requests',
            entityId: request.id,
            afterState: { destinationSchool, reason },
            userId: performedBy,
            correlationId
        });
        return request;
    }
    async approveTransfer(requestId, performedBy, correlationId) {
        const req = await this.transferRepo.findTransferRequestById(requestId);
        if (!req) {
            throw new Error(`Transfer request ${requestId} not found`);
        }
        const student = await this.studentRepo.findById(req.studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        const oldStatus = student.status;
        await this.stateMachine.validateTransition(oldStatus, 'TRANSFERRED', 'admin');
        req.approve();
        await this.transferRepo.saveTransferRequest(req);
        // Save exit record
        const exit = {
            id: crypto.randomUUID(),
            studentId: req.studentId,
            exitType: 'Transfer',
            exitDate: new Date(),
            reason: req.reason,
            processedBy: performedBy
        };
        await this.transferRepo.saveExitRecord(exit);
        // Update student status
        student.transitionStatus('TRANSFERRED');
        await this.studentRepo.save(student);
        // Timeline status log
        await this.studentRepo.logStatusChange({
            student_id: req.studentId,
            old_status: oldStatus,
            new_status: 'TRANSFERRED',
            reason: `Transfer request approved: destination [${req.destinationSchool}]`,
            changed_by: performedBy
        });
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'STUDENT_TRANSFER_APPROVED',
            entityName: 'student_transfer_requests',
            entityId: requestId,
            afterState: { status: 'APPROVED' },
            userId: performedBy,
            correlationId
        });
    }
}
exports.TransferService = TransferService;
