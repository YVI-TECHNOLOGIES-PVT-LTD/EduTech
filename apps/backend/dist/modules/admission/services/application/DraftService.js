"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftService = void 0;
const prismaClient_1 = __importDefault(require("../../../../lib/prismaClient"));
const BaseService_1 = require("../BaseService");
const NotFoundError_1 = require("../../errors/NotFoundError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
class DraftService extends BaseService_1.BaseService {
    constructor(appRepo, auditService) {
        super();
        this.appRepo = appRepo;
        this.auditService = auditService;
    }
    async resumeDraft(id) {
        const app = await this.appRepo.findById(id);
        if (!app) {
            throw new NotFoundError_1.NotFoundError(`Application draft with ID ${id} not found`);
        }
        const enquiry = await this.loadEnquiryForApplication(app.leadId || null);
        return { application: app, enquiry };
    }
    async loadEnquiryForApplication(leadId) {
        if (!leadId)
            return null;
        const lead = await prismaClient_1.default.leads.findUnique({
            where: { lead_id: leadId },
            include: {
                academic_year_grades: {
                    include: { grades: true },
                },
            },
        });
        if (!lead)
            return null;
        const studentName = lead.student_last_name
            ? `${lead.student_first_name} ${lead.student_last_name}`
            : lead.student_first_name;
        return {
            id: lead.lead_id,
            student_name: studentName,
            parent_name: lead.contact_name,
            parent_email: lead.contact_email,
            parent_phone: lead.contact_phone,
            grade_applied_for: lead.academic_year_grades?.grades?.grade_name || 'Grade 1',
            remarks: lead.remarks,
        };
    }
    async patchDraftSection(id, section, payload, expectedUpdatedAt, correlationId) {
        const app = await this.appRepo.findById(id);
        if (!app) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${id} not found`);
        }
        if (app.status && app.status.toUpperCase() !== 'DRAFT') {
            throw new BusinessRuleError_1.BusinessRuleError(`Application ${app.applicationNumber || id} has been submitted and is read-only.`);
        }
    }
    async deleteDraft(id, correlationId) {
        const app = await this.appRepo.findById(id);
        if (!app) {
            throw new NotFoundError_1.NotFoundError(`Application draft with ID ${id} not found`);
        }
        await this.appRepo.softDelete(id);
    }
}
exports.DraftService = DraftService;
