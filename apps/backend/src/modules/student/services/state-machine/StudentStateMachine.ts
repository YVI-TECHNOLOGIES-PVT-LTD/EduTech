import { StudentRepository } from '../../repositories/StudentRepository';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class StudentStateMachine {
    constructor(private readonly studentRepo: StudentRepository) {}

    /**
     * Governs state path transitions: ACTIVE, PROMOTED, TRANSFERRED, LEFT, ALUMNI, SUSPENDED.
     */
    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.studentRepo.getWorkflowRule(fromStatus, toStatus, role);
        
        if (!isAllowed) {
            const fallbackRules: Record<string, string[]> = {
                'NEW': ['ACTIVE'],
                'ACTIVE': ['PROMOTED', 'SUSPENDED', 'TRANSFERRED', 'LEFT', 'ALUMNI'],
                'PROMOTED': ['ACTIVE', 'ALUMNI'],
                'SUSPENDED': ['ACTIVE']
            };

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid student workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
        }
    }
}
