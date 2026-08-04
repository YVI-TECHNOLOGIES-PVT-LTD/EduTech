import { AllocationRepository } from '../repositories/AllocationRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { StudentValidationCoordinator } from './validators/StudentValidationCoordinator';
import { RollNumberGenerator } from './generators/RollNumberGenerator';
import { StudentAllocation } from '../domain/StudentAllocation';
import { AuditService } from '../../admission/services/AuditService';

export class ClassAllocationService {
    constructor(
        private readonly allocRepo: AllocationRepository,
        private readonly studentRepo: StudentRepository,
        private readonly validationCoordinator: StudentValidationCoordinator,
        private readonly rollNumGen: RollNumberGenerator,
        private readonly auditService: AuditService
    ) {}

    /**
     * Allocates candidate to a section, generates roll sequence, logs transfer history details.
     */
    public async allocateClass(
        studentId: string,
        academicYearId: string,
        grade: string,
        sectionId: string,
        rollNumberInput?: number,
        performedBy: string | null = null,
        correlationId?: string
    ): Promise<StudentAllocation> {
        await this.validationCoordinator.validateClassAllocation(
            studentId,
            academicYearId,
            grade,
            sectionId
        );

        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        const rollNumber = rollNumberInput || await this.rollNumGen.generateNextRoll(
            student.schoolId,
            academicYearId,
            grade,
            sectionId
        );

        const prevAlloc = await this.allocRepo.findByStudentId(studentId);

        const allocation = new StudentAllocation(
            crypto.randomUUID(),
            studentId,
            academicYearId,
            grade,
            sectionId,
            rollNumber,
            new Date()
        );
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
