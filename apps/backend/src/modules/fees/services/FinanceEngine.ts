import { DemandService } from './DemandService';
import { PaymentService } from './PaymentService';
import { ReceiptService } from './ReceiptService';
import { LedgerBalanceService } from './LedgerBalanceService';
import { EventPublisher } from './EventPublisher';
import { FeeStructureService } from './FeeStructureService';
import { FeePreviewResponseDto } from '../dto/FeePreviewDto';

export class FinanceEngine {
    /**
     * Initializes a billing demand for a candidate application or student.
     */
    public static async initializeDemand(params: {
        application_id?: string;
        student_id?: string;
        fee_structure_id: string;
        due_date: string;
        performedBy: string;
    }): Promise<any> {
        return await DemandService.generateDemand(params);
    }

    /**
     * Collects payment and posts ledger entries.
     */
    public static async collectPayment(params: {
        application_id?: string;
        student_id?: string;
        demand_id?: string;
        amount: number;
        payment_mode: 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank_Transfer' | 'Online_Gateway';
        transaction_reference?: string;
        bank_name?: string;
        gateway_name?: string;
        gateway_transaction_id?: string;
        payment_channel?: string;
        cashierId: string;
    }): Promise<any> {
        return await PaymentService.collectPayment(params);
    }

    /**
     * Generates or re-issues a payment receipt.
     */
    public static async generateReceipt(params: {
        payment_transaction_id: string;
        receipt_type?: 'ORIGINAL' | 'DUPLICATE' | 'REPRINT' | 'CANCELLED';
        generatedBy: string;
    }): Promise<any> {
        return await ReceiptService.generateReceipt(params);
    }

    /**
     * Calculates the outstanding running balance.
     */
    public static async calculateBalance(target: {
        student_id?: string;
        application_id?: string;
    }): Promise<number> {
        return await LedgerBalanceService.getBalance(target);
    }

    /**
     * Retrieves the complete transaction ledger history list.
     */
    public static async getLedgerHistory(target: {
        student_id?: string;
        application_id?: string;
    }): Promise<any[]> {
        return await LedgerBalanceService.getLedgerHistory(target);
    }

    /**
     * Previews matching fee structures and components for an application.
     */
    public static async getFeePreview(applicationId: string): Promise<FeePreviewResponseDto> {
        return await FeeStructureService.getFeePreview(applicationId);
    }

    /**
     * Publishes integrations domain events.
     */
    public static async publishEvents(eventName: string, payload: any): Promise<void> {
        await EventPublisher.publish(eventName, payload);
    }
}
