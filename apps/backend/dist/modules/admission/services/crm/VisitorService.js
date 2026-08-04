"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorService = void 0;
const BaseService_1 = require("../BaseService");
const AdmissionVisitor_1 = require("../../domain/AdmissionVisitor");
const create_visitor_dto_1 = require("../../dto/create-visitor.dto");
const update_visitor_dto_1 = require("../../dto/update-visitor.dto");
const NotFoundError_1 = require("../../errors/NotFoundError");
class VisitorService extends BaseService_1.BaseService {
    constructor(visitorRepo, auditService) {
        super();
        this.visitorRepo = visitorRepo;
        this.auditService = auditService;
    }
    async checkIn(schoolId, payload, createdBy, correlationId) {
        const validated = this.validate(create_visitor_dto_1.createVisitorSchema, payload);
        const id = crypto.randomUUID();
        const visitor = new AdmissionVisitor_1.AdmissionVisitor(id, schoolId, validated.visitor_name, validated.phone, validated.purpose, new Date(), null, validated.lead_id || null, createdBy, new Date(), validated.counselor_id || null, validated.remarks || null, validated.visit_type, null);
        const saved = await this.visitorRepo.save(visitor);
        await this.auditService.logAudit({
            userId: createdBy,
            action: 'INSERT',
            entityName: 'admission_visitors',
            entityId: saved.id,
            afterState: saved,
            correlationId
        });
        return saved;
    }
    async checkOut(id, payload, correlationId) {
        const validated = this.validate(update_visitor_dto_1.updateVisitorSchema, payload);
        const existing = await this.visitorRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Visitor entry with ID ${id} not found`);
        }
        const beforeState = { ...existing };
        const timeOut = validated.time_out ? new Date(validated.time_out) : new Date();
        const remarks = validated.remarks !== undefined ? validated.remarks : existing.remarks;
        const outcome = validated.visit_outcome !== undefined ? validated.visit_outcome : existing.visitOutcome;
        const updated = new AdmissionVisitor_1.AdmissionVisitor(existing.id, existing.schoolId, existing.visitorName, existing.phone, existing.purpose, existing.timeIn, timeOut, existing.leadId, existing.createdBy, existing.createdAt, existing.counselorId, remarks, existing.visitType, outcome);
        const saved = await this.visitorRepo.save(updated);
        await this.auditService.logAudit({
            userId: null,
            action: 'UPDATE',
            entityName: 'admission_visitors',
            entityId: saved.id,
            beforeState,
            afterState: saved,
            correlationId
        });
        return saved;
    }
    async getVisitorById(id) {
        const visitor = await this.visitorRepo.findById(id);
        if (!visitor) {
            throw new NotFoundError_1.NotFoundError(`Visitor with ID ${id} not found`);
        }
        return visitor;
    }
    async listVisitors(schoolId, page, limit, filters, search, sortColumn, sortOrder) {
        return this.visitorRepo.findAll(schoolId, page, limit, filters, search, sortColumn, sortOrder);
    }
}
exports.VisitorService = VisitorService;
