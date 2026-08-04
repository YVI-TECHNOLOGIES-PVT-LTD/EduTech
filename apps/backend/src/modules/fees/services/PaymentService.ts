import { supabase } from '../../../config/supabase';
import { LedgerPostingService } from './LedgerPostingService';
import { ReceiptService } from './ReceiptService';
import { EventPublisher } from './EventPublisher';

export class PaymentService {
    /**
     * Records a payment transaction and updates demand balances.
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
        const {
            application_id, student_id, demand_id, amount,
            payment_mode, transaction_reference, bank_name,
            gateway_name, gateway_transaction_id, payment_channel, cashierId
        } = params;

        // 1. Insert Payment Transaction Record
        const { data: transaction, error: txErr } = await supabase
            .from('payment_transactions')
            .insert({
                application_id: application_id || null,
                student_id: student_id || null,
                amount,
                payment_mode,
                transaction_reference,
                bank_name,
                gateway_name,
                gateway_transaction_id,
                payment_channel,
                cashier_id: cashierId,
                status: 'SUCCESS' // Cashier verified instantly in Phase 1
            })
            .select()
            .single();

        if (txErr || !transaction) {
            throw new Error(`Failed to create payment transaction: ${txErr?.message}`);
        }

        // 2. Resolve target demand to update balance_amount
        let targetDemandId = demand_id;
        if (!targetDemandId) {
            let query = supabase
                .from('fee_demands')
                .select('id, balance_amount')
                .in('status', ['PENDING', 'PARTIAL'])
                .order('due_date', { ascending: true })
                .limit(1);

            if (student_id) query = query.eq('student_id', student_id);
            else if (application_id) query = query.eq('application_id', application_id);

            const { data: demands } = await query;
            if (demands && demands.length > 0) {
                targetDemandId = demands[0].id;
            }
        }

        if (targetDemandId) {
            const { data: demand } = await supabase
                .from('fee_demands')
                .select('id, amount, balance_amount')
                .eq('id', targetDemandId)
                .single();

            if (demand) {
                const newBalance = Math.max(0, Number(demand.balance_amount) - Number(amount));
                const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

                await supabase
                    .from('fee_demands')
                    .update({ balance_amount: newBalance, status: newStatus })
                    .eq('id', targetDemandId);
            }
        }

        // 3. Post to Ledger (Credit reduces the outstanding balance)
        await LedgerPostingService.postEntry({
            application_id: application_id || null,
            student_id: student_id || null,
            transaction_type: 'PAYMENT',
            debit: 0,
            credit: amount,
            reference_type: 'PAYMENT',
            reference_id: transaction.id
        });

        // 4. Generate Receipt
        const receipt = await ReceiptService.generateReceipt({
            payment_transaction_id: transaction.id,
            generatedBy: cashierId
        });

        // 5. Log Finance Audit Log
        await supabase.from('finance_audit_logs').insert({
            action: 'PAYMENT_COLLECTED',
            entity_type: 'payment_transactions',
            entity_id: transaction.id,
            performed_by: cashierId,
            details: { amount, payment_mode, receipt_no: receipt.receipt_no }
        });

        // 6. Emit Events
        await EventPublisher.publish('PaymentReceived', {
            transaction_id: transaction.id,
            application_id,
            student_id,
            amount
        });
        await EventPublisher.publish('PaymentVerified', {
            transaction_id: transaction.id,
            receipt_no: receipt.receipt_no
        });

        return { transaction, receipt };
    }
}
