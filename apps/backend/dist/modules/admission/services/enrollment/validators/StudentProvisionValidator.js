"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProvisionValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
const REQUIRED_STEPS = new Set(['Student', 'Academic', 'Parent', 'Library', 'IDCard']);
const OPTIONAL_STEPS = new Set(['User', 'Transport', 'Hostel']);
class StudentProvisionValidator {
    constructor(provisionRepo) {
        this.provisionRepo = provisionRepo;
    }
    async validate(applicationId) {
        const jobs = await this.provisionRepo.findJobsByApplicationId(applicationId);
        const steps = [...REQUIRED_STEPS, ...OPTIONAL_STEPS];
        for (const step of steps) {
            const job = jobs.find(j => j.stepName === step);
            if (!job) {
                throw new BusinessRuleError_1.BusinessRuleError(`ERP Provisioning step "${step}" job has not been executed.`);
            }
            if (REQUIRED_STEPS.has(step) && job.status !== 'COMPLETED') {
                throw new BusinessRuleError_1.BusinessRuleError(`ERP Provisioning step "${step}" status is currently "${job.status}". Must be COMPLETED. Error: ${job.errorMessage || 'None'}`);
            }
            if (OPTIONAL_STEPS.has(step) && !['COMPLETED', 'SKIPPED'].includes(job.status)) {
                throw new BusinessRuleError_1.BusinessRuleError(`ERP Provisioning step "${step}" status is currently "${job.status}". Must be COMPLETED or SKIPPED.`);
            }
        }
    }
}
exports.StudentProvisionValidator = StudentProvisionValidator;
