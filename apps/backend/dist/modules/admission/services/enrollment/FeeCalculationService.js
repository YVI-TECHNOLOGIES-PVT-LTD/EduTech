"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeCalculationService = void 0;
class FeeCalculationService {
    constructor(feeRepo) {
        this.feeRepo = feeRepo;
    }
    async calculateFees(applicationId) {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        let totalAssigned = 0;
        let totalWaived = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;
        const componentsSummary = assignments.map(item => {
            totalAssigned += item.amount;
            totalWaived += item.waivedAmount;
            totalPaid += item.paidAmount;
            totalOutstanding += item.outstandingAmount;
            return {
                componentId: item.componentId,
                amount: item.amount,
                waivedAmount: item.waivedAmount,
                paidAmount: item.paidAmount,
                outstandingAmount: item.outstandingAmount
            };
        });
        return {
            applicationId,
            totalAssignedAmount: totalAssigned,
            totalWaivedAmount: totalWaived,
            totalPaidAmount: totalPaid,
            totalOutstandingAmount: totalOutstanding,
            components: componentsSummary
        };
    }
}
exports.FeeCalculationService = FeeCalculationService;
