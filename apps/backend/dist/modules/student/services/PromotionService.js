"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
const StudentPromotion_1 = require("../domain/StudentPromotion");
class PromotionService {
    constructor(promotionRepo, studentRepo, allocRepo, validationCoordinator, stateMachine, auditService) {
        this.promotionRepo = promotionRepo;
        this.studentRepo = studentRepo;
        this.allocRepo = allocRepo;
        this.validationCoordinator = validationCoordinator;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
    }
    async promoteStudent(studentId, toAcademicYearId, toGrade, toSectionId, promotionReason, performedBy, correlationId) {
        await this.validationCoordinator.validatePromotion(studentId);
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        const oldStatus = student.status;
        await this.stateMachine.validateTransition(oldStatus, 'PROMOTED', 'admin');
        // Fetch current class allocation
        const currentAlloc = await this.allocRepo.findByStudentId(studentId);
        const promotion = new StudentPromotion_1.StudentPromotion(crypto.randomUUID(), studentId, student.academicYearId, toAcademicYearId, currentAlloc ? currentAlloc.grade : 'Grade 1', toGrade, currentAlloc ? currentAlloc.sectionId : null, toSectionId, performedBy, new Date(), promotionReason);
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
exports.PromotionService = PromotionService;
