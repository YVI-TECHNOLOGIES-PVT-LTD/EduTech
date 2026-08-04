import { Payment, PaymentMode, PaymentStatus } from '../../domain/enrollment/Payment';
import { Receipt } from '../../domain/enrollment/Receipt';
import { supabase } from '../../../../config/supabase';

export class PaymentRepository {
    public async findById(id: string): Promise<Payment | null> {
        const { data, error } = await supabase
            .from('admission_payments')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new Payment(
            data.id,
            data.application_id,
            Number(data.amount),
            data.payment_mode as PaymentMode,
            data.transaction_number,
            data.gateway_reference,
            data.receipt_number,
            data.status as PaymentStatus,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async findPaymentsByApplicationId(applicationId: string): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('admission_payments')
            .select('*')
            .eq('application_id', applicationId);

        if (error) throw error;
        return (data || []).map(row => new Payment(
            row.id,
            row.application_id,
            Number(row.amount),
            row.payment_mode as PaymentMode,
            row.transaction_number,
            row.gateway_reference,
            row.receipt_number,
            row.status as PaymentStatus,
            new Date(row.created_at),
            new Date(row.updated_at)
        ));
    }

    public async save(payment: Payment): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async saveReceipt(receipt: Receipt): Promise<void> {
        const { error } = await supabase
            .from('admission_payment_receipts')
            .upsert({
                id: receipt.id,
                payment_id: receipt.paymentId,
                receipt_number: receipt.receiptNumber,
                issued_at: receipt.issuedAt.toISOString()
            });

        if (error) throw error;
    }

    public async findReceiptByPaymentId(paymentId: string): Promise<Receipt | null> {
        const { data, error } = await supabase
            .from('admission_payment_receipts')
            .select('*')
            .eq('payment_id', paymentId)
            .maybeSingle();

        if (error) throw error;
        return data ? new Receipt(
            data.id,
            data.payment_id,
            data.receipt_number,
            new Date(data.issued_at)
        ) : null;
    }
}
