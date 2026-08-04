"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptService = void 0;
class ReceiptService {
    constructor(paymentRepo) {
        this.paymentRepo = paymentRepo;
    }
    async getReceiptByPaymentId(paymentId) {
        return this.paymentRepo.findReceiptByPaymentId(paymentId);
    }
}
exports.ReceiptService = ReceiptService;
