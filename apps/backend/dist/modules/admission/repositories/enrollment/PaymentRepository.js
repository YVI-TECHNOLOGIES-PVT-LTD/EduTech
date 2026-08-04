"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const Payment_1 = require("../../domain/enrollment/Payment");
const Receipt_1 = require("../../domain/enrollment/Receipt");
const supabase_1 = require("../../../../config/supabase");
class PaymentRepository {
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_payments')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Payment_1.Payment(data.id, data.application_id, Number(data.amount), data.payment_mode, data.transaction_number, data.gateway_reference, data.receipt_number, data.status, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async findPaymentsByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_payments')
            .select('*')
            .eq('application_id', applicationId);
        if (error)
            throw error;
        return (data || []).map(row => new Payment_1.Payment(row.id, row.application_id, Number(row.amount), row.payment_mode, row.transaction_number, row.gateway_reference, row.receipt_number, row.status, new Date(row.created_at), new Date(row.updated_at)));
    }
    async save(payment) {
        const { error } = await supabase_1.supabase
            .from('admission_payments')
            .upsert({
            id: payment.id,
            application_id: payment.applicationId,
            amount: payment.amount,
            payment_mode: payment.paymentMode,
            transaction_number: payment.transactionNumber,
            gateway_reference: payment.gatewayReference,
            receipt_number: payment.receiptNumber,
            status: payment.status,
            updated_at: payment.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async saveReceipt(receipt) {
        const { error } = await supabase_1.supabase
            .from('admission_payment_receipts')
            .upsert({
            id: receipt.id,
            payment_id: receipt.paymentId,
            receipt_number: receipt.receiptNumber,
            issued_at: receipt.issuedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async findReceiptByPaymentId(paymentId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_payment_receipts')
            .select('*')
            .eq('payment_id', paymentId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Receipt_1.Receipt(data.id, data.payment_id, data.receipt_number, new Date(data.issued_at)) : null;
    }
}
exports.PaymentRepository = PaymentRepository;
