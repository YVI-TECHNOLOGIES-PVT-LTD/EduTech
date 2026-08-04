"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class ReceiptValidator {
    constructor(paymentRepo) {
        this.paymentRepo = paymentRepo;
    }
    async validate(applicationId) {
        const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId);
        const completed = payments.filter(p => p.status === 'COMPLETED');
        for (const pay of completed) {
            const receipt = await this.paymentRepo.findReceiptByPaymentId(pay.id);
            if (!receipt) {
                throw new BusinessRuleError_1.BusinessRuleError(`Receipt details not found for payment transaction: ${pay.receiptNumber}`);
            }
        }
    }
}
exports.ReceiptValidator = ReceiptValidator;
