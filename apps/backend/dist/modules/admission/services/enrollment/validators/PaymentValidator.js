"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class PaymentValidator {
    constructor(feeRepo, paymentRepo) {
        this.feeRepo = feeRepo;
        this.paymentRepo = paymentRepo;
    }
    async validate(applicationId) {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        let totalOutstanding = 0;
        for (const item of assignments) {
            totalOutstanding += item.outstandingAmount;
        }
        if (assignments.length > 0) {
            if (totalOutstanding > 0) {
                throw new BusinessRuleError_1.BusinessRuleError(`Payment validation failed. Candidate outstanding fees balance is outstanding: ${totalOutstanding} INR.`);
            }
            return;
        }
        const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId);
        const hasCompletedPayment = payments.some(p => p.status === 'COMPLETED');
        if (!hasCompletedPayment) {
            throw new BusinessRuleError_1.BusinessRuleError('No completed fee payment found for this application.');
        }
    }
}
exports.PaymentValidator = PaymentValidator;
