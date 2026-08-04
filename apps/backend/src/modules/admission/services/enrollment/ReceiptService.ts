import { PaymentRepository } from '../../repositories/enrollment/PaymentRepository';
import { Receipt } from '../../domain/enrollment/Receipt';

export class ReceiptService {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    public async getReceiptByPaymentId(paymentId: string): Promise<Receipt | null> {
        return this.paymentRepo.findReceiptByPaymentId(paymentId);
    }
}
