import { PaymentRepository } from '../../repositories/enrollment/PaymentRepository';
import { PaymentService } from './PaymentService';
import { AuditService } from '../AuditService';
import { BusinessRuleError } from '../../errors/BusinessRuleError';

export class PaymentVerificationService {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly paymentService: PaymentService,
        private readonly auditService: AuditService
    ) {}

    public async verifyTransaction(
        paymentId: string,
        status: 'COMPLETED' | 'FAILED',
        performedBy: string | null,
        correlationId?: string
    ): Promise<void> {
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) {
            throw new Error(`Payment transaction with ID ${paymentId} not found`);
        }

        if (payment.status !== 'PENDING') {
            throw new BusinessRuleError(`Payment status is "${payment.status}". Only PENDING transactions can be verified.`);
        }

        if (status === 'COMPLETED') {
            await this.paymentService.completePaymentTransaction(payment, performedBy, correlationId);
        } else {
            payment.transitionStatus('FAILED');
            await this.paymentRepo.save(payment);
        }

        // Audit Trail log
        await this.auditService.logAudit({
            action: `PAYMENT_VERIFIED_${status}`,
            entityName: 'admission_payments',
            entityId: paymentId,
            afterState: { status },
            userId: performedBy,
            correlationId
        });
    }
}
