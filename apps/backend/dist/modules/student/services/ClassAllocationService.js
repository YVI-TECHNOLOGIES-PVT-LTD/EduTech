"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassAllocationService = void 0;
const StudentAllocation_1 = require("../domain/StudentAllocation");
class ClassAllocationService {
    constructor(allocRepo, studentRepo, validationCoordinator, rollNumGen, auditService) {
        this.allocRepo = allocRepo;
        this.studentRepo = studentRepo;
        this.validationCoordinator = validationCoordinator;
        this.rollNumGen = rollNumGen;
        this.auditService = auditService;
    }
    /**
     * Allocates candidate to a section, generates roll sequence, logs transfer history details.
     */
    async allocateClass(studentId, academicYearId, grade, sectionId, rollNumberInput, performedBy = null, correlationId) {
        await this.validationCoordinator.validateClassAllocation(studentId, academicYearId, grade, sectionId);
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }
        const rollNumber = rollNumberInput || await this.rollNumGen.generateNextRoll(student.schoolId, academicYearId, grade, sectionId);
        const prevAlloc = await this.allocRepo.findByStudentId(studentId);
        const allocation = new StudentAllocation_1.StudentAllocation(crypto.randomUUID(), studentId, academicYearId, grade, sectionId, rollNumber, new Date());
        await this.allocRepo.saveAllocation(allocation);
        if (prevAlloc && prevAlloc.sectionId !== sectionId) {
            await this.allocRepo.saveHistory({
                student_id: studentId,
                from_section_id: prevAlloc.sectionId,
                to_section_id: sectionId,
                grade,
                academic_year_id: academicYearId,
                reason: 'Section transferred'
            });
        }
        await this.studentRepo.logStatusChange({
            student_id: studentId,
            old_status: student.status,
            new_status: student.status,
            reason: `Allocated to Grade: ${grade}, Section: ${sectionId}, Roll Number: ${rollNumber}`,
            changed_by: performedBy
        });
        await this.auditService.logAudit({
            action: 'STUDENT_CLASS_ALLOCATED',
            entityName: 'student_class_allocations',
            entityId: allocation.id,
            afterState: { grade, sectionId, rollNumber },
            userId: performedBy,
            correlationId
        });
        return allocation;
    }
}
exports.ClassAllocationService = ClassAllocationService;
