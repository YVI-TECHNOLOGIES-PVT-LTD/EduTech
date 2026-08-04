import { FeeRepository } from '../../../repositories/enrollment/FeeRepository';
import { PaymentRepository } from '../../../repositories/enrollment/PaymentRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class FeeValidator {
    constructor(
        private readonly feeRepo: FeeRepository,
        private readonly paymentRepo: PaymentRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        if (assignments && assignments.length > 0) {
            return;
        }

        const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId);
        const hasCompletedPayment = payments.some(p => p.status === 'COMPLETED');
        if (!hasCompletedPayment) {
            throw new BusinessRuleError('No fee structures components are currently assigned to this application.');
        }
    }
}
