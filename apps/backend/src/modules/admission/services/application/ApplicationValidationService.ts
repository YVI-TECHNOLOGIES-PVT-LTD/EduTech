import { LeadValidator } from './validators/LeadValidator';
import { AgeValidator } from './validators/AgeValidator';
import { DuplicateValidator } from './validators/DuplicateValidator';
import { WorkflowValidator } from './validators/WorkflowValidator';
import { AcademicValidator } from './validators/AcademicValidator';

export class ApplicationValidationService {
    constructor(
        private readonly leadValidator: LeadValidator,
        private readonly ageValidator: AgeValidator,
        private readonly duplicateValidator: DuplicateValidator,
        private readonly workflowValidator: WorkflowValidator,
        private readonly academicValidator: AcademicValidator
    ) {}

    /**
     * Executes creation pipeline validations: Lead, Academic year, Age match, and Duplicates check.
     */
    public async validateCreation(
        leadId: string,
        studentName: string,
        dateOfBirth: Date,
        schoolId: string,
        academicYearId: string,
        grade: string
    ): Promise<void> {
        await this.leadValidator.validate(leadId);
        await this.academicValidator.validate(schoolId, academicYearId);
        await this.ageValidator.validate(dateOfBirth, grade);
        await this.duplicateValidator.validate(leadId, studentName, dateOfBirth, academicYearId);
    }

    /**
     * Executes state transitions validations.
     */
    public async validateWorkflowTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        await this.workflowValidator.validate(fromStatus, toStatus, role);
    }
}
