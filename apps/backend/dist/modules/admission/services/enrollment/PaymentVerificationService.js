"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentVerificationService = void 0;
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
class PaymentVerificationService {
    constructor(paymentRepo, paymentService, auditService) {
        this.paymentRepo = paymentRepo;
        this.paymentService = paymentService;
        this.auditService = auditService;
    }
    async verifyTransaction(paymentId, status, performedBy, correlationId) {
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) {
            throw new Error(`Payment transaction with ID ${paymentId} not found`);
        }
        if (payment.status !== 'PENDING') {
            throw new BusinessRuleError_1.BusinessRuleError(`Payment status is "${payment.status}". Only PENDING transactions can be verified.`);
        }
        if (status === 'COMPLETED') {
            await this.paymentService.completePaymentTransaction(payment, performedBy, correlationId);
        }
        else {
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
exports.PaymentVerificationService = PaymentVerificationService;
