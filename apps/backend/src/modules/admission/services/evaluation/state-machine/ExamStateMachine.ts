import { ExamRepository } from '../../../repositories/evaluation/ExamRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class ExamStateMachine {
    constructor(private readonly examRepo: ExamRepository) {}

    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.examRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback for safety/testing
            const fallbackRules: Record<string, string[]> = {
                'SCHEDULED': ['ONGOING'],
                'ONGOING': ['COMPLETED'],
                'COMPLETED': ['EVALUATED']
            };

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid exam workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
        }
    }
}
