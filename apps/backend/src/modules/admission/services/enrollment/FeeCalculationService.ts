import { FeeRepository } from '../../repositories/enrollment/FeeRepository';

export interface FeeCalculationSummary {
    applicationId: string;
    totalAssignedAmount: number;
    totalWaivedAmount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    components: Array<{
        componentId: string;
        amount: number;
        waivedAmount: number;
        paidAmount: number;
        outstandingAmount: number;
    }>;
}

export class FeeCalculationService {
    constructor(private readonly feeRepo: FeeRepository) {}

    public async calculateFees(applicationId: string): Promise<FeeCalculationSummary> {
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
