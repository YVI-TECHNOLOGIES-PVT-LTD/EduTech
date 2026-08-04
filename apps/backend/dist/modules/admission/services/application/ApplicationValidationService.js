"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationValidationService = void 0;
class ApplicationValidationService {
    constructor(leadValidator, ageValidator, duplicateValidator, workflowValidator, academicValidator) {
        this.leadValidator = leadValidator;
        this.ageValidator = ageValidator;
        this.duplicateValidator = duplicateValidator;
        this.workflowValidator = workflowValidator;
        this.academicValidator = academicValidator;
    }
    /**
     * Executes creation pipeline validations: Lead, Academic year, Age match, and Duplicates check.
     */
    async validateCreation(leadId, studentName, dateOfBirth, schoolId, academicYearId, grade) {
        await this.leadValidator.validate(leadId);
        await this.academicValidator.validate(schoolId, academicYearId);
        await this.ageValidator.validate(dateOfBirth, grade);
        await this.duplicateValidator.validate(leadId, studentName, dateOfBirth, academicYearId);
    }
    /**
     * Executes state transitions validations.
     */
    async validateWorkflowTransition(fromStatus, toStatus, role) {
        await this.workflowValidator.validate(fromStatus, toStatus, role);
    }
}
exports.ApplicationValidationService = ApplicationValidationService;
