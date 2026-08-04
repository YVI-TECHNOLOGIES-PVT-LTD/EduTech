"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpService = void 0;
const BaseService_1 = require("../BaseService");
const AdmissionFollowup_1 = require("../../domain/AdmissionFollowup");
const create_followup_dto_1 = require("../../dto/create-followup.dto");
const update_followup_dto_1 = require("../../dto/update-followup.dto");
const NotFoundError_1 = require("../../errors/NotFoundError");
class FollowUpService extends BaseService_1.BaseService {
    constructor(followupRepo, leadRepo, auditService) {
        super();
        this.followupRepo = followupRepo;
        this.leadRepo = leadRepo;
        this.auditService = auditService;
    }
    async scheduleFollowup(payload, createdBy, correlationId) {
        const validated = this.validate(create_followup_dto_1.createFollowupSchema, payload);
        // Check if lead exists
        const lead = await this.leadRepo.findById(validated.lead_id);
        if (!lead) {
            throw new NotFoundError_1.NotFoundError(`Lead with ID ${validated.lead_id} not found`);
        }
        const id = crypto.randomUUID();
        const followup = new AdmissionFollowup_1.AdmissionFollowup(id, validated.lead_id, new Date(validated.scheduled_date), null, 'scheduled', validated.notes || null, createdBy, new Date(), new Date());
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
    async updateFollowup(id, payload, correlationId) {
        const validated = this.validate(update_followup_dto_1.updateFollowupSchema, payload);
        const existing = await this.followupRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Followup with ID ${id} not found`);
        }
        const beforeState = { ...existing };
        // Create updated followup instance
        const status = validated.status !== undefined ? validated.status : existing.status;
        const notes = validated.notes !== undefined ? validated.notes : existing.notes;
        const completedDate = validated.completed_date !== undefined ? (validated.completed_date ? new Date(validated.completed_date) : null) : existing.completedDate;
        const updated = new AdmissionFollowup_1.AdmissionFollowup(existing.id, existing.leadId, existing.scheduledDate, completedDate, status, notes, existing.createdBy, existing.createdAt, new Date());
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
    async getFollowupById(id) {
        const followup = await this.followupRepo.findById(id);
        if (!followup) {
            throw new NotFoundError_1.NotFoundError(`Followup with ID ${id} not found`);
        }
        return followup;
    }
    async listFollowups(filters, page, limit, sortColumn, sortOrder) {
        return this.followupRepo.findAll(filters, page, limit, sortColumn, sortOrder);
    }
}
exports.FollowUpService = FollowUpService;
