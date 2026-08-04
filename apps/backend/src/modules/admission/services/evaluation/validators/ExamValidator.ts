import { ApplicationValidator } from './ApplicationValidator';
import { DocumentValidator } from './DocumentValidator';
import { InterviewRepository } from '../../../repositories/evaluation/InterviewRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class ExamValidator {
    constructor(
        private readonly appVal: ApplicationValidator,
        private readonly docVal: DocumentValidator,
        private readonly interviewRepo: InterviewRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        await this.appVal.validate(applicationId);
        await this.docVal.validate(applicationId);

        const interview = await this.interviewRepo.findByApplicationId(applicationId);
        if (!interview) {
            throw new BusinessRuleError('Interview must be scheduled and completed before entrance exam allocation.');
        }
        if (interview.status !== 'EVALUATED') {
            throw new BusinessRuleError('Interview evaluation must be completed before entrance exam allocation.');
        }
    }
}
