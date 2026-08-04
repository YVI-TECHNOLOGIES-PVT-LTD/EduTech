"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const BaseService_1 = require("../BaseService");
const AdmissionLead_1 = require("../../domain/AdmissionLead");
const update_lead_dto_1 = require("../../dto/update-lead.dto");
const CrmRecordMapper_1 = require("./CrmRecordMapper");
const ConflictError_1 = require("../../errors/ConflictError");
const NotFoundError_1 = require("../../errors/NotFoundError");
class LeadService extends BaseService_1.BaseService {
    constructor(leadRepo, enquiryRepo, appRepo, auditService) {
        super();
        this.leadRepo = leadRepo;
        this.enquiryRepo = enquiryRepo;
        this.appRepo = appRepo;
        this.auditService = auditService;
    }
    async getLeadById(id) {
        const lead = await this.leadRepo.findById(id);
        if (!lead) {
            throw new NotFoundError_1.NotFoundError(`Lead with ID ${id} not found`);
        }
        const enquiry = lead.enquiryId ? await this.enquiryRepo.findById(lead.enquiryId) : null;
        const applicationId = (await this.appRepo.findCurrentByLeadId(lead.id))?.id ?? null;
        const counselorName = lead.counselorId
            ? (await (0, CrmRecordMapper_1.resolveCounselorNames)([lead.counselorId])).get(lead.counselorId) ?? null
            : null;
        const assignmentMap = await (0, CrmRecordMapper_1.resolveAssignmentHistory)([lead.id]);
        return (0, CrmRecordMapper_1.mapLeadToApiRecord)(lead, enquiry, applicationId, counselorName, assignmentMap.get(lead.id));
    }
    async listLeads(filters, page, limit, sortColumn, sortOrder) {
        const { data: leads, total } = await this.leadRepo.findAll(filters, page, limit, sortColumn, sortOrder);
        const enquiryIds = leads.map(l => l.enquiryId).filter(Boolean);
        const leadIds = leads.map(l => l.id);
        const enquiryMap = new Map();
        await Promise.all(enquiryIds.map(async (id) => {
            const enquiry = await this.enquiryRepo.findById(id);
            if (enquiry)
                enquiryMap.set(id, enquiry);
        }));
        const applicationMap = await this.appRepo.findCurrentIdsByLeadIds(leadIds);
        const counselorNames = await (0, CrmRecordMapper_1.resolveCounselorNames)(leads.map(l => l.counselorId).filter(Boolean));
        const assignmentMap = await (0, CrmRecordMapper_1.resolveAssignmentHistory)(leadIds);
        const data = await Promise.all(leads.map(lead => (0, CrmRecordMapper_1.mapLeadToApiRecord)(lead, lead.enquiryId ? enquiryMap.get(lead.enquiryId) : null, applicationMap.get(lead.id) ?? null, lead.counselorId ? counselorNames.get(lead.counselorId) ?? null : null, assignmentMap.get(lead.id))));
        return { data, total };
    }
    async updateLead(id, payload, correlationId) {
        const validated = this.validate(update_lead_dto_1.updateLeadSchema, payload);
        const existing = await this.leadRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Lead with ID ${id} not found`);
        }
        const beforeState = { ...existing };
        // 1. Validate optimistic lock timestamp
        const expectedUpdatedAt = new Date(validated.updated_at);
        const actualUpdatedAt = new Date(existing.updatedAt);
        if (actualUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
            throw new ConflictError_1.ConflictError('Concurrent modification detected. Please refresh and try again.');
        }
        // 2. Map updates
        const updatedStatus = validated.status !== undefined ? validated.status : existing.status;
        const updatedCounselor = validated.counselor_id !== undefined ? validated.counselor_id : existing.counselorId;
        const updatedLostReason = validated.lost_reason !== undefined ? validated.lost_reason : existing.lostReason;
        const updated = new AdmissionLead_1.AdmissionLead(existing.id, existing.enquiryId, updatedCounselor, updatedStatus, updatedLostReason, existing.createdAt, new Date(), existing.deletedAt);
        let saved;
        try {
            saved = await this.leadRepo.saveWithOptimisticLock(updated, actualUpdatedAt);
        }
        catch (error) {
            if (error.message === 'OPTIMISTIC_LOCK_FAILED') {
                throw new ConflictError_1.ConflictError('Concurrent modification detected. Lock check failed.');
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
    async deleteLead(id, correlationId) {
        const existing = await this.leadRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Lead with ID ${id} not found`);
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
exports.LeadService = LeadService;
