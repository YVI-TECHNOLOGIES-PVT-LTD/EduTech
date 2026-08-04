import { FeeRepository } from '../../../repositories/enrollment/FeeRepository';
import { PaymentRepository } from '../../../repositories/enrollment/PaymentRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class PaymentValidator {
    constructor(
        private readonly feeRepo: FeeRepository,
        private readonly paymentRepo: PaymentRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId);

        let totalOutstanding = 0;
        for (const item of assignments) {
            totalOutstanding += item.outstandingAmount;
        }

        if (assignments.length > 0) {
            if (totalOutstanding > 0) {
                throw new BusinessRuleError(
                    `Payment validation failed. Candidate outstanding fees balance is outstanding: ${totalOutstanding} INR.`
                );
            }
            return;
        }

        const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId);
        const hasCompletedPayment = payments.some(p => p.status === 'COMPLETED');
        if (!hasCompletedPayment) {
            throw new BusinessRuleError('No completed fee payment found for this application.');
        }
    }
}
