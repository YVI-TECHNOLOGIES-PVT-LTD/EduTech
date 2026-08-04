import { BaseService } from '../BaseService';
import { LeadRepository } from '../../repositories/crm/LeadRepository';
import { AdmissionLead } from '../../domain/AdmissionLead';
import { AssignmentStrategy } from './assignment/AssignmentStrategy';
import { ManualAssignmentStrategy } from './assignment/ManualAssignmentStrategy';
import { RoundRobinAssignmentStrategy } from './assignment/RoundRobinAssignmentStrategy';
import { AuditService } from '../AuditService';
import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';
import { EnquiryRepository } from '../../repositories/crm/EnquiryRepository';
import { AdmissionCRMTransactionService } from './AdmissionCRMTransactionService';

export class CounselorAssignmentService extends BaseService {
    constructor(
        private readonly leadRepo: LeadRepository,
        private readonly auditService: AuditService,
        private readonly enquiryRepo: EnquiryRepository,
        private readonly transactionService: AdmissionCRMTransactionService
    ) {
        super();
    }

    /**
     * Assigns a counselor to a lead using the specified strategy.
     */
    public async assignCounselor(
        leadId: string,
        strategyType: 'manual' | 'round_robin',
        strategyParams: { counselorId?: string; updatedAt?: string; reassign?: boolean; ip?: string; browser?: string },
        correlationId?: string,
        userId?: string | null
    ): Promise<AdmissionLead> {
        let lead = await this.leadRepo.findById(leadId);
        if (!lead) {
            // Check if it is an Enquiry ID
            const enquiry = await this.enquiryRepo.findById(leadId);
            if (!enquiry) {
                throw new NotFoundError(`Lead or Enquiry with ID ${leadId} not found`);
            }
            // Automatically convert Enquiry to Lead atomically
            await this.transactionService.convertEnquiryToLead(leadId, leadId, correlationId, strategyParams.counselorId);
            lead = await this.leadRepo.findById(leadId);
            if (!lead) {
                throw new Error(`Failed to retrieve lead after converting enquiry ${leadId}`);
            }
        }

        // Enforce conversion guard (check if lead is converted to active application)
        const { data: existingApp } = await (await import('../../../../config/supabase')).supabase
            .from('admission_applications')
            .select('id')
            .eq('lead_id', lead.id)
            .maybeSingle();

        if (existingApp) {
            throw new ConflictError('Converted applications cannot be reassigned.');
        }

        // Enforce assignment constraints
        if (lead.counselorId !== null) {
            if (!strategyParams.reassign) {
                throw new ConflictError('Lead already assigned');
            }
        }

        const actualUpdatedAt = new Date(lead.updatedAt);

        // Validate optimistic locking if updatedAt is provided
        if (strategyParams.updatedAt) {
            const expectedUpdatedAt = new Date(strategyParams.updatedAt);
            if (actualUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
                throw new ConflictError('Concurrent modification detected. Please refresh.');
            }
        }

        // Instantiate Strategy
        let strategy: AssignmentStrategy;
        if (strategyType === 'manual') {
            if (!strategyParams.counselorId) {
                throw new Error('Counselor ID must be provided for manual assignment');
            }
            strategy = new ManualAssignmentStrategy(strategyParams.counselorId);
        } else {
            strategy = new RoundRobinAssignmentStrategy();
        }

        const counselorId = await strategy.assign(lead);

        const logAssignmentAudit = async (savedLead: AdmissionLead, prevLead: AdmissionLead) => {
            const enquiry = lead.enquiryId ? await this.enquiryRepo.findById(lead.enquiryId) : null;
            const schoolId = enquiry?.schoolId || null;
            const academicYearId = enquiry?.academicYearId || null;

            await this.auditService.logStatusChange({
                entityName: 'admission_leads',
                entityId: savedLead.id,
                oldStatus: prevLead.status,
                newStatus: savedLead.status,
                changedBy: userId || null,
                reason: strategyParams.reassign ? 'Counselor reassigned' : `Counselor assigned via strategy: ${strategyType}`,
                metadata: {
                    assigned_by: userId || null,
                    assigned_to: counselorId,
                    timestamp: new Date().toISOString(),
                    school_id: schoolId,
                    academic_year_id: academicYearId,
                    correlation_id: correlationId || null,
                    ip: strategyParams.ip || null,
                    browser: strategyParams.browser || null
                },
                correlationId,
                eventName: 'LeadCounselorAssigned',
            });

            await this.auditService.logAudit({
                userId: userId || null,
                action: strategyParams.reassign ? 'REASSIGN_COUNSELOR' : 'ASSIGN_COUNSELOR',
                entityName: 'admission_leads',
                entityId: savedLead.id,
                beforeState: prevLead,
                afterState: savedLead,
                correlationId,
            });
        };

        // Case 2: Lead already assigned to SAME counselor (Idempotency)
        if (lead.counselorId === counselorId) {
            const { data: existingHistory } = await (await import('../../../../config/supabase')).supabase
                .from('status_history')
                .select('id')
                .eq('entity_name', 'admission_leads')
                .eq('entity_id', lead.id)
                .eq('event_name', 'LeadCounselorAssigned')
                .limit(1);
            if (!existingHistory?.length) {
                await logAssignmentAudit(lead, lead);
            }
            return lead;
        }

        // Case 3: Lead assigned to DIFFERENT counselor (Reassignment Check)
        if (lead.counselorId !== null && lead.counselorId !== counselorId) {
            if (lead.status === 'LOST') {
                throw new ConflictError('Cannot reassign counselor for lost leads');
            }
        }

        // Update Lead Domain Model
        const updated = new AdmissionLead(
            lead.id,
            lead.enquiryId,
            counselorId,
            lead.status,
            lead.lostReason,
            lead.createdAt,
            new Date(),
            lead.deletedAt
        );

        let saved: AdmissionLead;
        try {
            saved = await this.leadRepo.saveWithOptimisticLock(updated, actualUpdatedAt);
        } catch (error: any) {
            if (error.message === 'OPTIMISTIC_LOCK_FAILED') {
                throw new ConflictError('Concurrent modification detected during assignment check.');
            }
            throw error;
        }

        // Log Status History / Assignment change
        await logAssignmentAudit(saved, lead);

        return saved;
    }
}
