import { supabase } from '../../../../config/supabase';
import { BaseService } from '../BaseService';
import { EnquiryRepository } from '../../repositories/crm/EnquiryRepository';
import { NotFoundError } from '../../errors/NotFoundError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';

export class AdmissionCRMTransactionService extends BaseService {
    constructor(private readonly enquiryRepo: EnquiryRepository) {
        super();
    }

    /**
     * Executes the conversion of an Enquiry to a Lead atomically.
     */
    public async convertEnquiryToLead(enquiryId: string, leadId: string, correlationId?: string, counselorId?: string | null): Promise<void> {
        const enquiry = await this.enquiryRepo.findById(enquiryId);
        if (!enquiry) {
            throw new NotFoundError(`Enquiry with ID ${enquiryId} not found`);
        }

        if (enquiry.status === 'converted') {
            throw new BusinessRuleError('Enquiry is already converted to a lead');
        }

        const safeCorrelationId = this.sanitizeCorrelationId(correlationId);

        // Construct query statements
        const sqlQueries: string[] = [
            `UPDATE public.admission_enquiries SET status = 'converted', updated_at = NOW() WHERE id = '${enquiryId}'`,
            `INSERT INTO public.admission_leads (id, enquiry_id, counselor_id, status, created_at, updated_at) VALUES ('${leadId}', '${enquiryId}', ${counselorId ? `'${counselorId}'` : 'NULL'}, 'NEW', NOW(), NOW())`,
            `INSERT INTO public.status_history (entity_name, entity_id, old_status, new_status, reason, correlation_id, event_name, created_at) VALUES ('admission_leads', '${leadId}', NULL, 'NEW', 'Lead created from converted enquiry', ${safeCorrelationId ? `'${safeCorrelationId}'` : 'NULL'}, 'LeadCreated', NOW())`
        ];

        // Call the database-level generic transaction executor
        const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: sqlQueries });

        if (error) {
            this.logError('Transaction execution failed', error, correlationId);
            throw new Error(`Database transaction failed: ${error.message}`);
        }

        this.logInfo(`Successfully converted enquiry ${enquiryId} to lead ${leadId} inside database transaction.`, correlationId);
    }
}
