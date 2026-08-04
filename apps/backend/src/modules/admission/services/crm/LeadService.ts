import { BaseService } from '../BaseService';
import { LeadRepository } from '../../repositories/crm/LeadRepository';
import { EnquiryRepository } from '../../repositories/crm/EnquiryRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { AdmissionLead, LeadStatus } from '../../domain/AdmissionLead';
import { updateLeadSchema } from '../../dto/update-lead.dto';
import { AuditService } from '../AuditService';
import { mapLeadToApiRecord, resolveAssignmentHistory, resolveCounselorNames } from './CrmRecordMapper';
import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';

export class LeadService extends BaseService {
    constructor(
        private readonly leadRepo: LeadRepository,
        private readonly enquiryRepo: EnquiryRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly auditService: AuditService
    ) {
        super();
    }

    public async getLeadById(id: string): Promise<Record<string, unknown>> {
        const lead = await this.leadRepo.findById(id);
        if (!lead) {
            throw new NotFoundError(`Lead with ID ${id} not found`);
        }
        const enquiry = lead.enquiryId ? await this.enquiryRepo.findById(lead.enquiryId) : null;
        const applicationId = (await this.appRepo.findCurrentByLeadId(lead.id))?.id ?? null;
        const counselorName = lead.counselorId
            ? (await resolveCounselorNames([lead.counselorId])).get(lead.counselorId) ?? null
            : null;
        const assignmentMap = await resolveAssignmentHistory([lead.id]);
        return mapLeadToApiRecord(lead, enquiry, applicationId, counselorName, assignmentMap.get(lead.id));
    }

    public async listLeads(
        filters: { counselorId?: string; status?: string },
        page: number,
        limit: number,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: Record<string, unknown>[]; total: number }> {
        const { data: leads, total } = await this.leadRepo.findAll(filters, page, limit, sortColumn, sortOrder);
        const enquiryIds = leads.map(l => l.enquiryId).filter(Boolean) as string[];
        const leadIds = leads.map(l => l.id);

        const enquiryMap = new Map<string, Awaited<ReturnType<EnquiryRepository['findById']>>>();
        await Promise.all(
            enquiryIds.map(async id => {
                const enquiry = await this.enquiryRepo.findById(id);
                if (enquiry) enquiryMap.set(id, enquiry);
            })
        );

        const applicationMap = await this.appRepo.findCurrentIdsByLeadIds(leadIds);
        const counselorNames = await resolveCounselorNames(leads.map(l => l.counselorId).filter(Boolean) as string[]);
        const assignmentMap = await resolveAssignmentHistory(leadIds);

        const data = await Promise.all(
            leads.map(lead =>
                mapLeadToApiRecord(
                    lead,
                    lead.enquiryId ? enquiryMap.get(lead.enquiryId) : null,
                    applicationMap.get(lead.id) ?? null,
                    lead.counselorId ? counselorNames.get(lead.counselorId) ?? null : null,
                    assignmentMap.get(lead.id)
                )
            )
        );

        return { data, total };
    }

    public async updateLead(id: string, payload: any, correlationId?: string): Promise<AdmissionLead> {
        const validated = this.validate(updateLeadSchema, payload);
        const existing = await this.leadRepo.findById(id);
        if (!existing) {
            throw new NotFoundError(`Lead with ID ${id} not found`);
        }

        const beforeState = { ...existing };

        // 1. Validate optimistic lock timestamp
        const expectedUpdatedAt = new Date(validated.updated_at);
        const actualUpdatedAt = new Date(existing.updatedAt);
        if (actualUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
            throw new ConflictError('Concurrent modification detected. Please refresh and try again.');
        }

        // 2. Map updates
        const updatedStatus = validated.status !== undefined ? validated.status as LeadStatus : existing.status;
        const updatedCounselor = validated.counselor_id !== undefined ? validated.counselor_id : existing.counselorId;
        const updatedLostReason = validated.lost_reason !== undefined ? validated.lost_reason : existing.lostReason;

        const updated = new AdmissionLead(
            existing.id,
            existing.enquiryId,
            updatedCounselor,
            updatedStatus,
            updatedLostReason,
            existing.createdAt,
            new Date(),
            existing.deletedAt
        );

        let saved: AdmissionLead;
        try {
            saved = await this.leadRepo.saveWithOptimisticLock(updated, actualUpdatedAt);
        } catch (error: any) {
            if (error.message === 'OPTIMISTIC_LOCK_FAILED') {
                throw new ConflictError('Concurrent modification detected. Lock check failed.');
            }
            throw error;
        }

        // 3. Write Status History if transition occurred
        if (beforeState.status !== saved.status) {
            await this.auditService.logStatusChange({
                entityName: 'admission_leads',
                entityId: saved.id,
                oldStatus: beforeState.status,
                newStatus: saved.status,
                changedBy: null,
                reason: saved.lostReason || undefined,
                correlationId,
                eventName: 'LeadStatusChanged'
            });
        }

        // 4. Log Audit
        await this.auditService.logAudit({
            userId: null,
            action: 'UPDATE',
            entityName: 'admission_leads',
            entityId: saved.id,
            beforeState,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async deleteLead(id: string, correlationId?: string): Promise<void> {
        const existing = await this.leadRepo.findById(id);
        if (!existing) {
            throw new NotFoundError(`Lead with ID ${id} not found`);
        }

        await this.leadRepo.softDelete(id);

        await this.auditService.logAudit({
            userId: null,
            action: 'DELETE',
            entityName: 'admission_leads',
            entityId: id,
            beforeState: existing,
            correlationId
        });
    }
}
