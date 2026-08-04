import { PaymentRepository } from '../../../repositories/enrollment/PaymentRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class ReceiptValidator {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    public async validate(applicationId: string): Promise<void> {
        const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId);
        const completed = payments.filter(p => p.status === 'COMPLETED');

        for (const pay of completed) {
            const receipt = await this.paymentRepo.findReceiptByPaymentId(pay.id);
            if (!receipt) {
                throw new BusinessRuleError(`Receipt details not found for payment transaction: ${pay.receiptNumber}`);
            }
        }
    }
}
