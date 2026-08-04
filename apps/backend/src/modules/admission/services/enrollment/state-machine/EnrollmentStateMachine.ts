import { EnrollmentRepository } from '../../../repositories/enrollment/EnrollmentRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class EnrollmentStateMachine {
    constructor(private readonly enrollRepo: EnrollmentRepository) {}

    /**
     * Asserts that dynamic workflow status changes are allowed.
     */
    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.enrollRepo.getWorkflowRule(fromStatus, toStatus, role);
        
        if (!isAllowed) {
            const fallbackRules: Record<string, string[]> = {
                'OFFER_ACCEPTED': ['PAYMENT_PENDING'],
                'PAYMENT_PENDING': ['PAYMENT_COMPLETED'],
                'PAYMENT_COMPLETED': ['ADMISSION_CONFIRMED'],
                'ADMISSION_CONFIRMED': ['STUDENT_CREATED', 'ENROLLED'],
                'STUDENT_CREATED': ['ENROLLED'],
            };

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid enrollment workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
        }
    }
}
