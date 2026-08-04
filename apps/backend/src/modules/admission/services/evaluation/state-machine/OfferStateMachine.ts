import { OfferRepository } from '../../../repositories/evaluation/OfferRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class OfferStateMachine {
    constructor(private readonly offerRepo: OfferRepository) {}

    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.offerRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback for safety/testing
            const fallbackRules: Record<string, string[]> = {
                'GENERATED': ['SENT'],
                'SENT': ['ACCEPTED', 'EXPIRED'],
                'ACCEPTED': ['ENROLLED']
            };

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid offer workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
        }
    }
}
