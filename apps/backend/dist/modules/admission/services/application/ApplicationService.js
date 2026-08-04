"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const BaseService_1 = require("../BaseService");
const AdmissionApplication_1 = require("../../domain/application/AdmissionApplication");
const ApplicationProfile_1 = require("../../domain/application/ApplicationProfile");
const ApplicationDTO_1 = require("../../dto/application/ApplicationDTO");
const NotFoundError_1 = require("../../errors/NotFoundError");
const ValidationError_1 = require("../../errors/ValidationError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
const LEGACY_STATUS_MAP = {
    draft: 'DRAFT',
    submitted: 'SUBMITTED',
    under_review: 'UNDER_REVIEW',
    docs_pending: 'DOCS_PENDING',
    docs_verified: 'DOCUMENT_VERIFIED',
    document_verified: 'DOCUMENT_VERIFIED',
    interview: 'INTERVIEW',
    exam: 'EXAM',
    merit: 'MERIT',
    offered: 'OFFERED',
    payment_pending: 'FEE_PENDING',
    fee_pending: 'FEE_PENDING',
    payment_verified: 'FEE_VERIFIED',
    fee_verified: 'FEE_VERIFIED',
    approved: 'OFFERED',
    enrolled: 'ENROLLED',
    rejected: 'REJECTED',
};
class ApplicationService extends BaseService_1.BaseService {
    constructor(appRepo, valService, workflowService, auditService, workflowOrchestrator) {
        super();
        this.appRepo = appRepo;
        this.valService = valService;
        this.workflowService = workflowService;
        this.auditService = auditService;
        this.workflowOrchestrator = workflowOrchestrator;
    }
    /**
     * Registers a new Admission Application.
     */
    async createApplication(schoolId, academicYearId, createdBy, payload, correlationId) {
        const validated = this.validate(ApplicationDTO_1.createApplicationSchema, payload);
        // Pre-validate creation criteria
        const dob = new Date(payload.date_of_birth);
        const name = payload.student_name;
        if (!payload.date_of_birth || !payload.student_name) {
            throw new ValidationError_1.ValidationError('Student Name and Date of Birth are required to validate application creation');
        }
        await this.valService.validateCreation(validated.lead_id, name, dob, schoolId, academicYearId, validated.grade);
        const id = crypto.randomUUID();
        const application = new AdmissionApplication_1.AdmissionApplication(id, schoolId, academicYearId, validated.lead_id, 'DRAFT', 1, true, createdBy, 'Application initialized as draft', null, new Date(), new Date());
        await this.appRepo.save(application);
        // Initialize empty profile
        const profile = new ApplicationProfile_1.ApplicationProfile(crypto.randomUUID(), id, dob, payload.gender || 'Other', payload.blood_group || null, payload.nationality || null, payload.religion || null, payload.category || null, payload.aadhaar || null, null, // photo_url placeholder
        null, null, null, new Date(), new Date());
        await this.appRepo.saveProfile(profile);
        // Log Timeline
        await this.appRepo.logWorkflow(id, 'INITIALIZE_DRAFT', null, 'DRAFT', createdBy, 'Initial draft created');
        // Audit Trail
        await this.auditService.logAudit({
            action: 'APPLICATION_CREATED',
            entityName: 'admission_applications',
            entityId: id,
            afterState: { schoolId, academicYearId, grade: validated.grade, leadId: validated.lead_id },
            userId: createdBy,
            correlationId
        });
        return application;
    }
    /**
     * Submits an application draft for review.
     */
    async submitApplication(id, payload, role, performedBy, correlationId) {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${id} not found`);
        }
        if (application.status === 'SUBMITTED') {
            throw new BusinessRuleError_1.BusinessRuleError('Application is already submitted and locked');
        }
        // Validate payload matches all required submit fields
        const validated = this.validate(ApplicationDTO_1.submitApplicationSchema, payload);
        // Transition status to SUBMITTED via state machine
        const updated = await this.workflowService.transitionTo(id, 'SUBMITTED', role, performedBy, validated.change_reason || 'Application submitted successfully', correlationId);
        return updated;
    }
    /**
     * Formats application timeline states log details.
     */
    async getTimeline(id) {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${id} not found`);
        }
        const events = await this.appRepo.findTimeline(id);
        return events.map(e => ({
            action: e.action,
            fromStatus: e.from_status,
            toStatus: e.to_status,
            performedBy: e.performed_by,
            notes: e.notes,
            timestamp: e.created_at
        }));
    }
    async listForParent(userId, userEmail) {
        return this.appRepo.findByParentUser(userId, userEmail);
    }
    async assertParentCanAccess(applicationId, userId, userEmail) {
        const allowed = await this.appRepo.isOwnedByParent(applicationId, userId, userEmail);
        if (!allowed) {
            throw new BusinessRuleError_1.BusinessRuleError('You do not have access to this application.');
        }
    }
    async listForStaff(schoolId, filters) {
        const crmStatus = filters.status
            ? (LEGACY_STATUS_MAP[filters.status.toLowerCase()] ?? filters.status.toUpperCase())
            : undefined;
        return this.appRepo.findAllPaginated({
            schoolId,
            status: crmStatus,
            search: filters.search,
            page: filters.page,
            limit: filters.limit,
        });
    }
    async getStats(schoolId) {
        return this.appRepo.findAllForStats(schoolId);
    }
    async rejectApplication(applicationId, performedBy, reason, role, correlationId) {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${applicationId} not found`);
        }
        if (application.status === 'ENROLLED') {
            throw new BusinessRuleError_1.BusinessRuleError('Cannot reject an enrolled application.');
        }
        const oldStatus = application.status;
        application.updateStatus('REJECTED', reason);
        await this.appRepo.save(application);
        await this.appRepo.logWorkflow(applicationId, 'APPLICATION_REJECTED', oldStatus, 'REJECTED', performedBy, reason);
        await this.auditService.logAudit({
            action: 'APPLICATION_REJECTED',
            entityName: 'admission_applications',
            entityId: applicationId,
            afterState: { status: 'REJECTED', reason },
            userId: performedBy,
            correlationId,
        });
        return application;
    }
    async verifyDocuments(applicationId, performedBy, remark, role, correlationId) {
        if (!this.workflowOrchestrator) {
            throw new BusinessRuleError_1.BusinessRuleError('Workflow orchestrator not configured');
        }
        return this.workflowOrchestrator.publish('DOCUMENT_VERIFIED', applicationId, {
            userId: performedBy,
            role,
            correlationId,
            notes: remark,
        });
    }
}
exports.ApplicationService = ApplicationService;
