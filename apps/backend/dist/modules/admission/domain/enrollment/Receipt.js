"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Receipt = void 0;
class Receipt {
    constructor(id, paymentId, receiptNumber, issuedAt) {
        this.id = id;
        this.paymentId = paymentId;
        this.receiptNumber = receiptNumber;
        this.issuedAt = issuedAt;
    }
}
exports.Receipt = Receipt;
