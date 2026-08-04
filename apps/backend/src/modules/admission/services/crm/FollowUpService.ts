import { BaseService } from '../BaseService';
import { FollowUpRepository } from '../../repositories/crm/FollowUpRepository';
import { LeadRepository } from '../../repositories/crm/LeadRepository';
import { AdmissionFollowup, FollowupStatus } from '../../domain/AdmissionFollowup';
import { createFollowupSchema } from '../../dto/create-followup.dto';
import { updateFollowupSchema } from '../../dto/update-followup.dto';
import { AuditService } from '../AuditService';
import { NotFoundError } from '../../errors/NotFoundError';

export class FollowUpService extends BaseService {
    constructor(
        private readonly followupRepo: FollowUpRepository,
        private readonly leadRepo: LeadRepository,
        private readonly auditService: AuditService
    ) {
        super();
    }

    public async scheduleFollowup(payload: any, createdBy: string, correlationId?: string): Promise<AdmissionFollowup> {
        const validated = this.validate(createFollowupSchema, payload);

        // Check if lead exists
        const lead = await this.leadRepo.findById(validated.lead_id);
        if (!lead) {
            throw new NotFoundError(`Lead with ID ${validated.lead_id} not found`);
        }

        const id = crypto.randomUUID();
        const followup = new AdmissionFollowup(
            id,
            validated.lead_id,
            new Date(validated.scheduled_date),
            null,
            'scheduled',
            validated.notes || null,
            createdBy,
            new Date(),
            new Date()
        );

        const saved = await this.followupRepo.save(followup);

        // Status history for follow-up state
        await this.auditService.logStatusChange({
            entityName: 'admission_followups',
            entityId: saved.id,
            oldStatus: null,
            newStatus: 'scheduled',
            changedBy: createdBy,
            correlationId,
            eventName: 'FollowupScheduled'
        });

        // Audit Log
        await this.auditService.logAudit({
            userId: createdBy,
            action: 'INSERT',
            entityName: 'admission_followups',
            entityId: saved.id,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async updateFollowup(id: string, payload: any, correlationId?: string): Promise<AdmissionFollowup> {
        const validated = this.validate(updateFollowupSchema, payload);
        const existing = await this.followupRepo.findById(id);
        if (!existing) {
            throw new NotFoundError(`Followup with ID ${id} not found`);
        }

        const beforeState = { ...existing };

        // Create updated followup instance
        const status = validated.status !== undefined ? validated.status as FollowupStatus : existing.status;
        const notes = validated.notes !== undefined ? validated.notes : existing.notes;
        const completedDate = validated.completed_date !== undefined ? (validated.completed_date ? new Date(validated.completed_date) : null) : existing.completedDate;

        const updated = new AdmissionFollowup(
            existing.id,
            existing.leadId,
            existing.scheduledDate,
            completedDate,
            status,
            notes,
            existing.createdBy,
            existing.createdAt,
            new Date()
        );

        const saved = await this.followupRepo.save(updated);

        // Audit & History if status changed
        if (beforeState.status !== saved.status) {
            await this.auditService.logStatusChange({
                entityName: 'admission_followups',
                entityId: saved.id,
                oldStatus: beforeState.status,
                newStatus: saved.status,
                changedBy: null,
                correlationId,
                eventName: 'FollowupStatusChanged'
            });
        }

        await this.auditService.logAudit({
            userId: null,
            action: 'UPDATE',
            entityName: 'admission_followups',
            entityId: saved.id,
            beforeState,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async getFollowupById(id: string): Promise<AdmissionFollowup> {
        const followup = await this.followupRepo.findById(id);
        if (!followup) {
            throw new NotFoundError(`Followup with ID ${id} not found`);
        }
        return followup;
    }

    public async listFollowups(
        filters: { leadId?: string; status?: string },
        page: number,
        limit: number,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: AdmissionFollowup[]; total: number }> {
        return this.followupRepo.findAll(filters, page, limit, sortColumn, sortOrder);
    }
}
