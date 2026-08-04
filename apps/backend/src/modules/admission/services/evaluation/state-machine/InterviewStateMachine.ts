import { InterviewRepository } from '../../../repositories/evaluation/InterviewRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class InterviewStateMachine {
    constructor(private readonly interviewRepo: InterviewRepository) {}

    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.interviewRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback for safety/testing
            const fallbackRules: Record<string, string[]> = {
                'SCHEDULED': ['COMPLETED', 'EVALUATED'],
                'COMPLETED': ['EVALUATED'],
            };

            const normalizedRole = role.toUpperCase();
            const examCellRoles = new Set(['EXAM_CELL', 'EXAM_CELL_ADMIN', 'ADMIN']);

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid interview workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }

            if (
                !examCellRoles.has(normalizedRole) &&
                normalizedRole !== 'PANEL_MEMBER' &&
                toStatus === 'EVALUATED'
            ) {
                throw new BusinessRuleError(
                    `Invalid interview workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
            return;
        }
    }
}

