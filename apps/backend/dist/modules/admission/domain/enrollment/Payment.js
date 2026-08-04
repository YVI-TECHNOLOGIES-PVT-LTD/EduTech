"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
class Payment {
    constructor(id, applicationId, amount, paymentMode, transactionNumber, gatewayReference, receiptNumber, status, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.amount = amount;
        this.paymentMode = paymentMode;
        this.transactionNumber = transactionNumber;
        this.gatewayReference = gatewayReference;
        this.receiptNumber = receiptNumber;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    transitionStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
exports.Payment = Payment;
