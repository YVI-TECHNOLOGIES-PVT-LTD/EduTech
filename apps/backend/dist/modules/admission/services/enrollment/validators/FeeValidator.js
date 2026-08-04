"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class FeeValidator {
    constructor(feeRepo, paymentRepo) {
        this.feeRepo = feeRepo;
        this.paymentRepo = paymentRepo;
    }
    async validate(applicationId) {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        if (assignments && assignments.length > 0) {
            return;
        }
        const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId);
        const hasCompletedPayment = payments.some(p => p.status === 'COMPLETED');
        if (!hasCompletedPayment) {
            throw new BusinessRuleError_1.BusinessRuleError('No fee structures components are currently assigned to this application.');
        }
    }
}
exports.FeeValidator = FeeValidator;
