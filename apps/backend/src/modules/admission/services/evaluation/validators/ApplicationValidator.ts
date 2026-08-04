import { ApplicationRepository } from '../../../repositories/application/ApplicationRepository';
import { NotFoundError } from '../../../errors/NotFoundError';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class ApplicationValidator {
    constructor(private readonly appRepo: ApplicationRepository) {}

    public async validate(applicationId: string): Promise<void> {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new NotFoundError(`Application with ID ${applicationId} not found`);
        }

        if (app.deletedAt) {
            throw new BusinessRuleError(`Application with ID ${applicationId} is soft-deleted`);
        }

        const evaluationEligible = new Set([
            'SUBMITTED',
            'UNDER_REVIEW',
            'DOCS_PENDING',
            'DOCUMENT_VERIFIED',
            'INTERVIEW',
            'EXAM',
            'MERIT',
            'FEE_PENDING',
            'FEE_VERIFIED',
            'OFFERED',
        ]);

        if (!evaluationEligible.has(app.status)) {
            throw new BusinessRuleError(
                `Application is not eligible for the evaluation pipeline. Current status: ${app.status}`
            );
        }
    }
}
