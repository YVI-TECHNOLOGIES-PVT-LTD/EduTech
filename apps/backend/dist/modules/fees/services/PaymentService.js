"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const supabase_1 = require("../../../config/supabase");
const LedgerPostingService_1 = require("./LedgerPostingService");
const ReceiptService_1 = require("./ReceiptService");
const EventPublisher_1 = require("./EventPublisher");
class PaymentService {
    /**
     * Records a payment transaction and updates demand balances.
     */
    static async collectPayment(params) {
        const { application_id, student_id, demand_id, amount, payment_mode, transaction_reference, bank_name, gateway_name, gateway_transaction_id, payment_channel, cashierId } = params;
        // 1. Insert Payment Transaction Record
        const { data: transaction, error: txErr } = await supabase_1.supabase
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
            let query = supabase_1.supabase
                .from('fee_demands')
                .select('id, balance_amount')
                .in('status', ['PENDING', 'PARTIAL'])
                .order('due_date', { ascending: true })
                .limit(1);
            if (student_id)
                query = query.eq('student_id', student_id);
            else if (application_id)
                query = query.eq('application_id', application_id);
            const { data: demands } = await query;
            if (demands && demands.length > 0) {
                targetDemandId = demands[0].id;
            }
        }
        if (targetDemandId) {
            const { data: demand } = await supabase_1.supabase
                .from('fee_demands')
                .select('id, amount, balance_amount')
                .eq('id', targetDemandId)
                .single();
            if (demand) {
                const newBalance = Math.max(0, Number(demand.balance_amount) - Number(amount));
                const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';
                await supabase_1.supabase
                    .from('fee_demands')
                    .update({ balance_amount: newBalance, status: newStatus })
                    .eq('id', targetDemandId);
            }
        }
        // 3. Post to Ledger (Credit reduces the outstanding balance)
        await LedgerPostingService_1.LedgerPostingService.postEntry({
            application_id: application_id || null,
            student_id: student_id || null,
            transaction_type: 'PAYMENT',
            debit: 0,
            credit: amount,
            reference_type: 'PAYMENT',
            reference_id: transaction.id
        });
        // 4. Generate Receipt
        const receipt = await ReceiptService_1.ReceiptService.generateReceipt({
            payment_transaction_id: transaction.id,
            generatedBy: cashierId
        });
        // 5. Log Finance Audit Log
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'PAYMENT_COLLECTED',
            entity_type: 'payment_transactions',
            entity_id: transaction.id,
            performed_by: cashierId,
            details: { amount, payment_mode, receipt_no: receipt.receipt_no }
        });
        // 6. Emit Events
        await EventPublisher_1.EventPublisher.publish('PaymentReceived', {
            transaction_id: transaction.id,
            application_id,
            student_id,
            amount
        });
        await EventPublisher_1.EventPublisher.publish('PaymentVerified', {
            transaction_id: transaction.id,
            receipt_no: receipt.receipt_no
        });
        return { transaction, receipt };
    }
}
exports.PaymentService = PaymentService;
