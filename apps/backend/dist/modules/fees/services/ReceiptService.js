"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptService = void 0;
const supabase_1 = require("../../../config/supabase");
const DocumentNumberService_1 = require("./DocumentNumberService");
const EventPublisher_1 = require("./EventPublisher");
class ReceiptService {
    /**
     * Generates a new receipt record.
     */
    static async generateReceipt(params) {
        const { payment_transaction_id, receipt_type = 'ORIGINAL', generatedBy } = params;
        const schoolId = 'GWH001';
        const receipt_no = await DocumentNumberService_1.DocumentNumberService.generateNextNumber('RCPT', schoolId);
        const { data: receipt, error } = await supabase_1.supabase
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
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'RECEIPT_GENERATED',
            entity_type: 'fee_receipts',
            entity_id: receipt.id,
            performed_by: generatedBy,
            details: { receipt_no, receipt_type }
        });
        // Emit Event
        await EventPublisher_1.EventPublisher.publish('ReceiptGenerated', {
            receipt_id: receipt.id,
            receipt_no,
            payment_transaction_id
        });
        return receipt;
    }
    /**
     * Gets receipt details with related transaction/applicant mappings.
     */
    static async getReceiptDetails(receiptId) {
        const { data, error } = await supabase_1.supabase
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
        if (error)
            throw error;
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
exports.ReceiptService = ReceiptService;
