"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const prismaClient_1 = __importDefault(require("../../../../lib/prismaClient"));
const BaseService_1 = require("../BaseService");
const AdmissionApplication_1 = require("../../domain/application/AdmissionApplication");
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
     * Initializes a new application draft or retrieves an existing one.
     */
    async createApplication(schoolId, academicYearId, createdBy, payload, correlationId) {
        const validated = this.validate(ApplicationDTO_1.createApplicationSchema, payload);
        let targetOrgId = schoolId;
        if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
            const activeOrg = (await prismaClient_1.default.organizations.findFirst({ where: { status: 'active' } })) ||
                (await prismaClient_1.default.organizations.findFirst());
            if (activeOrg)
                targetOrgId = activeOrg.org_id;
        }
        let targetAyId = academicYearId;
        if (!targetAyId || targetAyId === 'ay-2026') {
            const activeAy = (await prismaClient_1.default.academic_years.findFirst({ where: { org_id: targetOrgId } })) ||
                (await prismaClient_1.default.academic_years.findFirst());
            if (activeAy)
                targetAyId = activeAy.academic_year_id;
        }
        // Validate Admission Configuration
        const config = (await prismaClient_1.default.admission_configurations.findFirst({
            where: { org_id: targetOrgId, academic_year_id: targetAyId },
        })) ||
            (await prismaClient_1.default.admission_configurations.findFirst({
                where: { org_id: targetOrgId },
            }));
        if (config) {
            if (config.allow_online_application === false) {
                throw new ValidationError_1.ValidationError('Online applications are currently disabled for this institution');
            }
            const today = new Date();
            if (config.admission_start_date && today < new Date(config.admission_start_date)) {
                throw new ValidationError_1.ValidationError('Admission window is not yet open');
            }
            if (config.admission_end_date && today > new Date(config.admission_end_date)) {
                throw new ValidationError_1.ValidationError('Admission window for this academic year has closed');
            }
        }
        // Resolve Parent record
        const parentRec = createdBy
            ? await prismaClient_1.default.parents.findFirst({
                where: { user_id: createdBy },
            })
            : null;
        // Resolve or reuse existing Lead record (Parent + Child matching)
        let leadId = payload.lead_id || validated.lead_id;
        let lead = null;
        if (leadId) {
            lead = await prismaClient_1.default.leads.findUnique({ where: { lead_id: leadId } });
        }
        const inputFirstName = (payload.student_first_name || payload.student_name || '')
            .trim()
            .toLowerCase();
        if (!lead && !payload.is_new_child) {
            const orConditions = [];
            if (parentRec?.parent_id) {
                orConditions.push({ parent_id: parentRec.parent_id });
            }
            if (createdBy) {
                orConditions.push({ created_by: createdBy });
            }
            if (payload.parent_email) {
                orConditions.push({ contact_email: payload.parent_email });
            }
            if (orConditions.length > 0) {
                const candidates = await prismaClient_1.default.leads.findMany({
                    where: { org_id: targetOrgId, OR: orConditions },
                    include: {
                        admissions_applications: {
                            select: { application_id: true, status: true },
                        },
                    },
                    orderBy: { created_at: 'asc' },
                });
                if (candidates.length > 0) {
                    if (inputFirstName) {
                        // First check if an existing lead belongs specifically to this child
                        const matchedChild = candidates.find((c) => {
                            const fn = (c.student_first_name || '').trim().toLowerCase();
                            return (fn === inputFirstName &&
                                !['applicant', 'student', ''].includes(fn) &&
                                !fn.endsWith("'s ward"));
                        });
                        if (matchedChild) {
                            lead = matchedChild;
                        }
                        else if (parentRec?.parent_id) {
                            // If no child match, check for an unassigned/registration-created Lead under this parent
                            const unassignedLead = candidates.find((c) => {
                                const fn = (c.student_first_name || '').trim().toLowerCase();
                                const isPlaceholder = ['applicant', 'student', ''].includes(fn) || fn.endsWith("'s ward");
                                const hasNoActiveApps = !c.admissions_applications ||
                                    c.admissions_applications.length === 0 ||
                                    c.admissions_applications.every((a) => a.status === 'draft' || a.status === 'withdrawn');
                                return c.parent_id === parentRec.parent_id && isPlaceholder && hasNoActiveApps;
                            });
                            if (unassignedLead) {
                                lead = unassignedLead;
                            }
                        }
                    }
                    else {
                        // Match latest lead only if it has an active DRAFT application
                        const candidate = candidates[0];
                        const draftApp = candidate.admissions_applications?.find((a) => a.status === 'draft');
                        if (draftApp) {
                            lead = candidate;
                        }
                    }
                }
            }
        }
        const dob = payload.date_of_birth && !isNaN(new Date(payload.date_of_birth).getTime())
            ? new Date(payload.date_of_birth)
            : undefined;
        if (lead) {
            leadId = lead.lead_id;
            // Update existing lead with latest student/contact fields
            const updateData = {
                student_first_name: payload.student_first_name || payload.student_name || lead.student_first_name,
                student_last_name: payload.student_last_name || lead.student_last_name || undefined,
                dob: dob || lead.dob,
                contact_name: payload.parent_name || lead.contact_name,
                contact_phone: payload.parent_phone || lead.contact_phone,
                contact_email: payload.parent_email || lead.contact_email,
            };
            if (payload.gender) {
                updateData.gender = payload.gender.toLowerCase();
            }
            if (parentRec?.parent_id) {
                updateData.parent_id = parentRec.parent_id;
            }
            await prismaClient_1.default.leads.update({
                where: { lead_id: leadId },
                data: updateData,
            });
        }
        else {
            const year = new Date().getFullYear();
            const leadCount = await prismaClient_1.default.leads.count();
            const leadNumber = `LEAD-${year}-${String(leadCount + 1).padStart(5, '0')}`;
            const ayg = (await prismaClient_1.default.academic_year_grades.findFirst({
                where: { academic_year_id: targetAyId },
            })) ||
                (await prismaClient_1.default.academic_year_grades.findFirst({
                    where: { is_active: true },
                })) ||
                (await prismaClient_1.default.academic_year_grades.findFirst());
            const targetAygId = payload.academic_year_grade_id || ayg?.academic_year_grade_id;
            const createData = {
                org_id: targetOrgId,
                lead_number: leadNumber,
                academic_year_grade_id: targetAygId,
                student_first_name: payload.student_first_name || payload.student_name || 'Applicant',
                student_last_name: payload.student_last_name || undefined,
                dob: dob,
                gender: payload.gender ? payload.gender.toLowerCase() : undefined,
                contact_name: payload.parent_name || 'Parent User',
                contact_phone: payload.parent_phone || '0000000000',
                contact_email: payload.parent_email || 'parent@example.com',
                source: 'website',
                stage: 'application_submitted',
                created_by: createdBy || undefined,
            };
            if (parentRec?.parent_id) {
                createData.parent_id = parentRec.parent_id;
            }
            const newLead = await prismaClient_1.default.leads.create({
                data: createData,
            });
            leadId = newLead.lead_id;
        }
        // Check duplicate application prevention
        const existingApp = await prismaClient_1.default.admissions_applications.findFirst({
            where: { lead_id: leadId },
        });
        if (existingApp) {
            const app = new AdmissionApplication_1.AdmissionApplication(existingApp.application_id, existingApp.org_id, existingApp.academic_year_id, existingApp.lead_id, (existingApp.status || 'SUBMITTED').toUpperCase(), 1, true, existingApp.created_by, 'Existing application retrieved', null, new Date(existingApp.created_at), new Date(existingApp.updated_at), null, existingApp.application_number);
            app.applicationNumber = existingApp.application_number;
            return app;
        }
        // Generate Server Authoritative Application Record
        const id = crypto.randomUUID();
        const year = new Date().getFullYear();
        const appCount = await prismaClient_1.default.admissions_applications.count();
        const appNumber = `APP-${year}-${String(appCount + 1).padStart(5, '0')}`;
        const newAppRecord = await prismaClient_1.default.admissions_applications.create({
            data: {
                application_id: id,
                application_number: appNumber,
                org_id: targetOrgId,
                academic_year_id: targetAyId,
                lead_id: leadId,
                status: 'submitted',
                created_by: createdBy || undefined,
            },
        });
        const application = new AdmissionApplication_1.AdmissionApplication(newAppRecord.application_id, newAppRecord.org_id, newAppRecord.academic_year_id, newAppRecord.lead_id, 'SUBMITTED', 1, true, newAppRecord.created_by, 'Application submitted successfully', null, new Date(newAppRecord.created_at), new Date(newAppRecord.updated_at), null, newAppRecord.application_number);
        application.applicationNumber = newAppRecord.application_number;
        // Log Timeline
        await this.appRepo.logWorkflow(id, 'INITIALIZE_DRAFT', null, 'SUBMITTED', createdBy, 'Initial application submitted');
        // Audit Trail
        await this.auditService.logAudit({
            action: 'APPLICATION_CREATED',
            entityName: 'admission_applications',
            entityId: id,
            afterState: {
                schoolId: targetOrgId,
                academicYearId: targetAyId,
                grade: validated.grade,
                leadId,
            },
            userId: createdBy,
            correlationId,
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
        return events.map((e) => ({
            action: e.action,
            fromStatus: e.from_status,
            toStatus: e.to_status,
            performedBy: e.performed_by,
            notes: e.notes,
            timestamp: e.created_at,
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
