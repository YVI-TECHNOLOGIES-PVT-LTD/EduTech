import { StudentProvisionRepository } from '../../../repositories/enrollment/StudentProvisionRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

const REQUIRED_STEPS = new Set(['Student', 'Academic', 'Parent', 'Library', 'IDCard']);
const OPTIONAL_STEPS = new Set(['User', 'Transport', 'Hostel']);

export class StudentProvisionValidator {
    constructor(private readonly provisionRepo: StudentProvisionRepository) {}

    public async validate(applicationId: string): Promise<void> {
        const jobs = await this.provisionRepo.findJobsByApplicationId(applicationId);
        const steps = [...REQUIRED_STEPS, ...OPTIONAL_STEPS];

        for (const step of steps) {
            const job = jobs.find(j => j.stepName === step);
            if (!job) {
                throw new BusinessRuleError(`ERP Provisioning step "${step}" job has not been executed.`);
            }
            if (REQUIRED_STEPS.has(step) && job.status !== 'COMPLETED') {
                throw new BusinessRuleError(
                    `ERP Provisioning step "${step}" status is currently "${job.status}". Must be COMPLETED. Error: ${job.errorMessage || 'None'}`
                );
            }
            if (OPTIONAL_STEPS.has(step) && !['COMPLETED', 'SKIPPED'].includes(job.status)) {
                throw new BusinessRuleError(
                    `ERP Provisioning step "${step}" status is currently "${job.status}". Must be COMPLETED or SKIPPED.`
                );
            }
        }
    }
}
