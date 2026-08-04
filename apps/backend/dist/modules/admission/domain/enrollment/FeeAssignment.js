"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeAssignment = void 0;
class FeeAssignment {
    constructor(id, applicationId, componentId, amount, waivedAmount, paidAmount, createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.componentId = componentId;
        this.amount = amount;
        this.waivedAmount = waivedAmount;
        this.paidAmount = paidAmount;
        this.createdAt = createdAt;
    }
    get outstandingAmount() {
        return Math.max(0, this.amount - this.waivedAmount - this.paidAmount);
    }
    recordPayment(amountToPay) {
        this.paidAmount += amountToPay;
    }
    recordWaiver(amountToWaive) {
        this.waivedAmount += amountToWaive;
    }
}
exports.FeeAssignment = FeeAssignment;
