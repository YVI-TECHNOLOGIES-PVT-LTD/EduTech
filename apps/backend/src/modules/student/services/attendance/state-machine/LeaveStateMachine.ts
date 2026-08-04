import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class LeaveStateMachine {
    /**
     * Governs leave request status transitions.
     */
    public validateTransition(
        fromStatus: string,
        toStatus: string
    ): void {
        const allowedTransitions: Record<string, string[]> = {
            'DRAFT': ['SUBMITTED'],
            'SUBMITTED': ['APPROVED', 'REJECTED'],
            'APPROVED': ['COMPLETED'],
            'REJECTED': ['DRAFT']
        };

        const isAllowed = allowedTransitions[fromStatus]?.includes(toStatus);
        if (!isAllowed) {
            throw new BusinessRuleError(
                `Invalid student leave request transition from [${fromStatus}] to [${toStatus}].`
            );
        }
    }
}
