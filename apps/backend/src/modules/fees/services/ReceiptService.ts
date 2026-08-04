import { supabase } from '../../../config/supabase';
import { DocumentNumberService } from './DocumentNumberService';
import { EventPublisher } from './EventPublisher';

export class ReceiptService {
    /**
     * Generates a new receipt record.
     */
    public static async generateReceipt(params: {
        payment_transaction_id: string;
        receipt_type?: 'ORIGINAL' | 'DUPLICATE' | 'REPRINT' | 'CANCELLED';
        generatedBy: string;
    }): Promise<any> {
        const { payment_transaction_id, receipt_type = 'ORIGINAL', generatedBy } = params;

        const schoolId = 'GWH001';
        const receipt_no = await DocumentNumberService.generateNextNumber('RCPT', schoolId);

        const { data: receipt, error } = await supabase
            .from('fee_receipts')
            .insert({
                receipt_no,
                payment_transaction_id,
                receipt_type,
                status: 'GENERATED',
                generated_by: generatedBy,
                generated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error || !receipt) {
            throw new Error(`Failed to generate fee receipt: ${error?.message}`);
        }

        // Log Finance Audit Log
        await supabase.from('finance_audit_logs').insert({
            action: 'RECEIPT_GENERATED',
            entity_type: 'fee_receipts',
            entity_id: receipt.id,
            performed_by: generatedBy,
            details: { receipt_no, receipt_type }
        });

        // Emit Event
        await EventPublisher.publish('ReceiptGenerated', {
            receipt_id: receipt.id,
            receipt_no,
            payment_transaction_id
        });

        return receipt;
    }

    /**
     * Gets receipt details with related transaction/applicant mappings.
     */
    public static async getReceiptDetails(receiptId: string): Promise<any> {
        const { data, error } = await supabase
            .from('fee_receipts')
            .select(`
                *,
                payment_transaction:payment_transaction_id(
                    *,
                    student:student_id(full_name, student_code),
                    application:application_id(
                        id,
                        lead:lead_id(
                            enquiry:enquiry_id(student_name, grade_applied_for)
                        )
                    )
                )
            `)
            .eq('id', receiptId)
            .single();

        if (error) throw error;
        
        if (data && data.payment_transaction?.application) {
            const enquiry = data.payment_transaction.application.lead?.enquiry;
            data.payment_transaction.application = {
                id: data.payment_transaction.application.id,
                applicant_name: enquiry?.student_name || 'Applicant',
                class_applied: enquiry?.grade_applied_for || ''
            };
        }
        
        return data;
    }
}
