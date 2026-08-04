import { LeadRepository } from '../../../repositories/crm/LeadRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';
import { NotFoundError } from '../../../errors/NotFoundError';

export class LeadValidator {
    constructor(private readonly leadRepo: LeadRepository) {}

    public async validate(leadId: string): Promise<void> {
        const lead = await this.leadRepo.findById(leadId);
        if (!lead) {
            throw new NotFoundError(`Lead with ID ${leadId} not found`);
        }

        // A lead is eligible for application creation unless it is closed (LOST, NOT_INTERESTED)
        // or already in a converted/terminal state.
        const INELIGIBLE_STATUSES: string[] = ['LOST', 'NOT_INTERESTED'];
        if (INELIGIBLE_STATUSES.includes(lead.status as string)) {
            throw new BusinessRuleError(
                `Lead is not eligible for application creation. Status is: ${lead.status}. Only active leads (NEW, CONTACTED, FOLLOW_UP, VISITED, INTERESTED) can be converted to applications.`
            );
        }
    }
}
