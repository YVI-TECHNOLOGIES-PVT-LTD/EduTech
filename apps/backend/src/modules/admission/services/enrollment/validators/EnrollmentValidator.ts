import { ApplicationRepository } from '../../../repositories/application/ApplicationRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class EnrollmentValidator {
    constructor(private readonly appRepo: ApplicationRepository) {}

    public async validate(applicationId: string): Promise<void> {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new Error(`Application with ID ${applicationId} not found`);
        }

        if (app.deletedAt) {
            throw new BusinessRuleError('Application has been soft-deleted and cannot be enrolled');
        }

        const enrollableStatuses = new Set(['OFFERED', 'FEE_VERIFIED', 'FEE_PENDING', 'ENROLLED']);
        if (!enrollableStatuses.has(app.status)) {
            throw new BusinessRuleError(
                `Application workflow status is ${app.status}. Must be approved with fees settled before enrollment.`
            );
        }
    }
}
