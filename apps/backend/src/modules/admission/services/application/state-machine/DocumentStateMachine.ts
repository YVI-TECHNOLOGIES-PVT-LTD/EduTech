import { DocumentRepository } from '../../../repositories/application/DocumentRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class DocumentStateMachine {
    constructor(private readonly docRepo: DocumentRepository) {}

    /**
     * Checks transitions integrity dynamically based on database review rules.
     */
    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.docRepo.getWorkflowRule(fromStatus, toStatus, role);
        
        if (!isAllowed) {
            // Fallback definitions for local testing / seeds safety
            const fallbackRules: Record<string, string[]> = {
                'UPLOADED': ['PENDING_VERIFICATION'],
                'PENDING_VERIFICATION': ['VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED'],
                'REJECTED': ['REUPLOADED'],
                'CORRECTION_REQUIRED': ['REUPLOADED'],
                'REUPLOADED': ['PENDING_VERIFICATION']
            };

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid document workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
        }
    }
}
