import { ConfirmationRepository } from '../../../repositories/enrollment/ConfirmationRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class ConfirmationValidator {
    constructor(private readonly confirmRepo: ConfirmationRepository) {}

    public async validate(applicationId: string): Promise<void> {
        const conf = await this.confirmRepo.findByApplicationId(applicationId);
        if (!conf) {
            throw new BusinessRuleError('Admission details have not been confirmed for this candidate.');
        }
    }
}
