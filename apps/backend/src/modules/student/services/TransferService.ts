import { TransferRepository } from '../repositories/TransferRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { StudentValidationCoordinator } from './validators/StudentValidationCoordinator';
import { StudentTransfer } from '../domain/StudentTransfer';
import { AuditService } from '../../admission/services/AuditService';
import { StudentStateMachine } from './state-machine/StudentStateMachine';

export class TransferService {
    constructor(
        private readonly transferRepo: TransferRepository,
        private readonly studentRepo: StudentRepository,
        private readonly validationCoordinator: StudentValidationCoordinator,
        private readonly stateMachine: StudentStateMachine,
        private readonly auditService: AuditService
    ) {}

    public async requestTransfer(
        studentId: string,
        destinationSchool: string,
        reason: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<StudentTransfer> {
        await this.validationCoordinator.validateTransfer(studentId);

        const request = new StudentTransfer(
            crypto.randomUUID(),
            studentId,
            destinationSchool,
            reason,
            new Date(),
            'PENDING'
        );
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

    public async approveTransfer(
        requestId: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<void> {
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
