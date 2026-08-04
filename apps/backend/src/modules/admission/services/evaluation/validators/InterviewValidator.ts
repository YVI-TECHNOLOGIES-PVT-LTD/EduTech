import { ApplicationRepository } from '../../../repositories/application/ApplicationRepository';
import { InterviewRepository } from '../../../repositories/evaluation/InterviewRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

const INTERVIEW_ELIGIBLE_STATUSES = new Set([
    'DOCUMENT_VERIFIED',
    'INTERVIEW',
    'UNDER_REVIEW',
    'SUBMITTED',
]);

export class InterviewValidator {
    constructor(
        private readonly appRepo: ApplicationRepository,
        private readonly interviewRepo: InterviewRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new BusinessRuleError(`Application ${applicationId} not found.`);
        }

        if (!INTERVIEW_ELIGIBLE_STATUSES.has(application.status)) {
            throw new BusinessRuleError(
                `Application must have verified documents before scheduling interview. Current status: ${application.status}.`
            );
        }

        const existing = await this.interviewRepo.findByApplicationId(applicationId);
        if (existing) {
            throw new BusinessRuleError(`An interview is already scheduled for this application.`);
        }
    }
}
