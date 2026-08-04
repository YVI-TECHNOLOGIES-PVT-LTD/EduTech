"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionCRMTransactionService = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseService_1 = require("../BaseService");
const NotFoundError_1 = require("../../errors/NotFoundError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
class AdmissionCRMTransactionService extends BaseService_1.BaseService {
    constructor(enquiryRepo) {
        super();
        this.enquiryRepo = enquiryRepo;
    }
    /**
     * Executes the conversion of an Enquiry to a Lead atomically.
     */
    async convertEnquiryToLead(enquiryId, leadId, correlationId, counselorId) {
        const enquiry = await this.enquiryRepo.findById(enquiryId);
        if (!enquiry) {
            throw new NotFoundError_1.NotFoundError(`Enquiry with ID ${enquiryId} not found`);
        }
        if (enquiry.status === 'converted') {
            throw new BusinessRuleError_1.BusinessRuleError('Enquiry is already converted to a lead');
        }
        const safeCorrelationId = this.sanitizeCorrelationId(correlationId);
        // Construct query statements
        const sqlQueries = [
            `UPDATE public.admission_enquiries SET status = 'converted', updated_at = NOW() WHERE id = '${enquiryId}'`,
            `INSERT INTO public.admission_leads (id, enquiry_id, counselor_id, status, created_at, updated_at) VALUES ('${leadId}', '${enquiryId}', ${counselorId ? `'${counselorId}'` : 'NULL'}, 'NEW', NOW(), NOW())`,
            `INSERT INTO public.status_history (entity_name, entity_id, old_status, new_status, reason, correlation_id, event_name, created_at) VALUES ('admission_leads', '${leadId}', NULL, 'NEW', 'Lead created from converted enquiry', ${safeCorrelationId ? `'${safeCorrelationId}'` : 'NULL'}, 'LeadCreated', NOW())`
        ];
        // Call the database-level generic transaction executor
        const { data, error } = await supabase_1.supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });
        if (error) {
            this.logError('Transaction execution failed', error, correlationId);
            throw new Error(`Database transaction failed: ${error.message}`);
        }
        this.logInfo(`Successfully converted enquiry ${enquiryId} to lead ${leadId} inside database transaction.`, correlationId);
    }
}
exports.AdmissionCRMTransactionService = AdmissionCRMTransactionService;
