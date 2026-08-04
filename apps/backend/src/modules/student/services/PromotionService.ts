import { PromotionRepository } from '../repositories/PromotionRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { AllocationRepository } from '../repositories/AllocationRepository';
import { StudentValidationCoordinator } from './validators/StudentValidationCoordinator';
import { StudentPromotion } from '../domain/StudentPromotion';
import { Student } from '../domain/Student';
import { AuditService } from '../../admission/services/AuditService';
import { StudentStateMachine } from './state-machine/StudentStateMachine';

export class PromotionService {
    constructor(
        private readonly promotionRepo: PromotionRepository,
        private readonly studentRepo: StudentRepository,
        private readonly allocRepo: AllocationRepository,
        private readonly validationCoordinator: StudentValidationCoordinator,
        private readonly stateMachine: StudentStateMachine,
        private readonly auditService: AuditService
    ) {}

    public async promoteStudent(
        studentId: string,
        toAcademicYearId: string,
        toGrade: string,
        toSectionId: string | null,
        promotionReason: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<StudentPromotion> {
        await this.validationCoordinator.validatePromotion(studentId);

        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        const oldStatus = student.status;
        await this.stateMachine.validateTransition(oldStatus, 'PROMOTED', 'admin');

        // Fetch current class allocation
        const currentAlloc = await this.allocRepo.findByStudentId(studentId);

        const promotion = new StudentPromotion(
            crypto.randomUUID(),
            studentId,
            student.academicYearId,
            toAcademicYearId,
            currentAlloc ? currentAlloc.grade : 'Grade 1',
            toGrade,
            currentAlloc ? currentAlloc.sectionId : null,
            toSectionId,
            performedBy,
            new Date(),
            promotionReason
        );
        await this.promotionRepo.savePromotion(promotion);

        // Transition student state to PROMOTED
        student.transitionStatus('PROMOTED');
        await this.studentRepo.save(student);

        // Timeline status log
        await this.studentRepo.logStatusChange({
            student_id: studentId,
            old_status: oldStatus,
            new_status: 'PROMOTED',
            reason: promotionReason,
            changed_by: performedBy
        });

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'STUDENT_PROMOTED',
            entityName: 'student_promotions',
            entityId: promotion.id,
            afterState: { toGrade, toAcademicYearId },
            userId: performedBy,
            correlationId
        });

        return promotion;
    }
}
