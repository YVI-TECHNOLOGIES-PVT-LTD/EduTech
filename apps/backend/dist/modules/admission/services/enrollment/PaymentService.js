"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const Payment_1 = require("../../domain/enrollment/Payment");
const Receipt_1 = require("../../domain/enrollment/Receipt");
class PaymentService {
    constructor(paymentRepo, feeRepo, appRepo, auditService, workflowOrchestrator) {
        this.paymentRepo = paymentRepo;
        this.feeRepo = feeRepo;
        this.appRepo = appRepo;
        this.auditService = auditService;
        this.workflowOrchestrator = workflowOrchestrator;
    }
    async collectPayment(applicationId, amount, paymentMode, transactionNumber, gatewayReference, performedBy, correlationId) {
        const receiptNum = `RCP-${applicationId.substring(0, 4).toUpperCase()}-${Date.now().toString().substring(8)}`;
        const payment = new Payment_1.Payment(crypto.randomUUID(), applicationId, amount, paymentMode, transactionNumber, gatewayReference, receiptNum, 'PENDING', new Date(), new Date());
        await this.paymentRepo.save(payment);
        if (paymentMode === 'Cash' || paymentMode === 'Card') {
            await this.completePaymentTransaction(payment, performedBy, correlationId);
        }
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'PAYMENT_INITIALIZED',
            entityName: 'admission_payments',
            entityId: payment.id,
            afterState: { amount, paymentMode, receiptNum, status: payment.status },
            userId: performedBy,
            correlationId
        });
        return payment;
    }
    async completePaymentTransaction(payment, performedBy, correlationId) {
        payment.transitionStatus('COMPLETED');
        await this.paymentRepo.save(payment);
        // Generate receipt metadata
        const receipt = new Receipt_1.Receipt(crypto.randomUUID(), payment.id, payment.receiptNumber, new Date());
        await this.paymentRepo.saveReceipt(receipt);
        // Allocate amount to outstanding assignments
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(payment.applicationId);
        let remainingAmount = payment.amount;
        for (const item of assignments) {
            if (remainingAmount <= 0)
                break;
            const due = item.outstandingAmount;
            if (due > 0) {
                const allocate = Math.min(remainingAmount, due);
                item.recordPayment(allocate);
                await this.feeRepo.saveAssignment(item);
                remainingAmount -= allocate;
            }
        }
        // Log timeline logs
        await this.appRepo.logWorkflow(payment.applicationId, 'FEE_PAYMENT_COMPLETED', null, 'SUBMITTED', performedBy, `Fee Payment transaction of ${payment.amount} INR completed. Receipt issued: ${payment.receiptNumber}`);
        if (this.workflowOrchestrator) {
            const application = await this.appRepo.findById(payment.applicationId);
            const ctx = {
                userId: performedBy,
                role: 'FINANCE_OFFICER',
                correlationId,
                notes: `Payment completed: ${payment.receiptNumber}`,
                schoolId: application?.schoolId,
                academicYearId: application?.academicYearId,
            };
            await this.workflowOrchestrator.publish('FEE_PAID', payment.applicationId, ctx);
        }
    }
}
exports.PaymentService = PaymentService;
