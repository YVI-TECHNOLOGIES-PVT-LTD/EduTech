"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceEngine = void 0;
const DemandService_1 = require("./DemandService");
const PaymentService_1 = require("./PaymentService");
const ReceiptService_1 = require("./ReceiptService");
const LedgerBalanceService_1 = require("./LedgerBalanceService");
const EventPublisher_1 = require("./EventPublisher");
const FeeStructureService_1 = require("./FeeStructureService");
class FinanceEngine {
    /**
     * Initializes a billing demand for a candidate application or student.
     */
    static async initializeDemand(params) {
        return await DemandService_1.DemandService.generateDemand(params);
    }
    /**
     * Collects payment and posts ledger entries.
     */
    static async collectPayment(params) {
        return await PaymentService_1.PaymentService.collectPayment(params);
    }
    /**
     * Generates or re-issues a payment receipt.
     */
    static async generateReceipt(params) {
        return await ReceiptService_1.ReceiptService.generateReceipt(params);
    }
    /**
     * Calculates the outstanding running balance.
     */
    static async calculateBalance(target) {
        return await LedgerBalanceService_1.LedgerBalanceService.getBalance(target);
    }
    /**
     * Retrieves the complete transaction ledger history list.
     */
    static async getLedgerHistory(target) {
        return await LedgerBalanceService_1.LedgerBalanceService.getLedgerHistory(target);
    }
    /**
     * Previews matching fee structures and components for an application.
     */
    static async getFeePreview(applicationId) {
        return await FeeStructureService_1.FeeStructureService.getFeePreview(applicationId);
    }
    /**
     * Publishes integrations domain events.
     */
    static async publishEvents(eventName, payload) {
        await EventPublisher_1.EventPublisher.publish(eventName, payload);
    }
}
exports.FinanceEngine = FinanceEngine;
