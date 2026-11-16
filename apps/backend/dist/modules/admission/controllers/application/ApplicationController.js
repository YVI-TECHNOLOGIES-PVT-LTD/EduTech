"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationController = void 0;
const prismaClient_1 = __importDefault(require("../../../../lib/prismaClient"));
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("../crm/ControllerErrorHandler");
const rbac_middleware_1 = require("../../../../rbac/rbac.middleware");
class ApplicationController {
    constructor(appService, draftService, workflowService, progressService, workflowOrchestrator, flagService, publicApplicationService) {
        this.appService = appService;
        this.draftService = draftService;
        this.workflowService = workflowService;
        this.progressService = progressService;
        this.workflowOrchestrator = workflowOrchestrator;
        this.flagService = flagService;
        this.publicApplicationService = publicApplicationService;
        this.listMine = async (req, res) => {
            try {
                await this.checkFlags(req);
                const user = req.context?.user;
                if (!user) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const applications = await this.appService.listForParent(user.id, user.email);
                const enriched = await Promise.all(applications.map(async (app) => {
                    const dbApp = await prismaClient_1.default.admissions_applications.findUnique({
                        where: { application_id: app.id },
                        include: {
                            leads: {
                                include: {
                                    academic_year_grades: {
                                        include: { grades: true },
                                    },
                                },
                            },
                        },
                    });
                    const lead = dbApp?.leads;
                    const studentName = lead
                        ? `${lead.student_first_name} ${lead.student_last_name || ''}`.trim()
                        : 'Applicant';
                    const gradeName = lead?.academic_year_grades?.grades?.grade_name || 'Grade 1';
                    const appNo = dbApp?.application_number || app.applicationNumber || app.id;
                    return {
                        id: app.id,
                        application_id: app.id,
                        application_number: appNo,
                        status: (app.status || 'submitted').toLowerCase(),
                        school_id: app.schoolId,
                        academic_year_id: app.academicYearId,
                        student_name: studentName,
                        grade_applied_for: gradeName,
                        parent_email: user.email,
                        updated_at: app.updatedAt.toISOString(),
                        created_at: app.createdAt.toISOString(),
                    };
                }));
                res.json({ data: enriched, total: enriched.length });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.list = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.query.school_id || req.context?.user?.school_id;
                if (!schoolId) {
                    return res.status(400).json({ error: 'School context is required' });
                }
                const { status, page, limit, search } = req.query;
                const result = await this.appService.listForStaff(schoolId, {
                    status: status,
                    search: search,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10,
                });
                res.json(result);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getStats = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.query.school_id || req.context?.user?.school_id;
                const stats = await this.appService.getStats(schoolId);
                res.json(stats);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.parentApply = async (req, res) => {
            try {
                await this.checkFlags(req);
                const user = req.context?.user;
                if (!user) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!this.publicApplicationService) {
                    return res.status(500).json({ error: 'Public application service not configured' });
                }
                const correlationId = req.headers['x-correlation-id'];
                const result = await this.publicApplicationService.applyAsAuthenticatedParent(user.id, user.email, req.body, correlationId);
                res.status(201).json({
                    success: true,
                    application_id: result.applicationId,
                    enquiry_id: result.enquiryId,
                    lead_id: result.leadId,
                    user_id: result.userId,
                    message: 'Application submitted successfully.',
                });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.create = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id || req.body.school_id || req.body.org_id || 'school-main';
                let academicYearId = req.headers['x-academic-year-id'] || req.body.academic_year_id;
                if (!academicYearId) {
                    academicYearId = 'ay-2026';
                }
                const createdBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.appService.createApplication(schoolId, academicYearId, createdBy, req.body, correlationId);
                const appNo = data.applicationNumber ||
                    data.application_number ||
                    data.applicationNumber ||
                    'APP-2026-00001';
                res.status(201).json({
                    success: true,
                    message: 'Application submitted successfully.',
                    application: {
                        application_id: data.id,
                        application_number: appNo,
                        status: (data.status || 'submitted').toLowerCase(),
                    },
                    application_id: data.id,
                    application_number: appNo,
                    status: (data.status || 'submitted').toLowerCase(),
                });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.resume = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const data = await this.draftService.resumeDraft(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.patchProfile = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const expectedUpdatedAt = req.headers['x-expected-updated-at'] || req.body.expected_updated_at;
                if (!expectedUpdatedAt) {
                    return res
                        .status(400)
                        .json({
                        error: 'x-expected-updated-at header/expected_updated_at attribute is required',
                    });
                }
                const correlationId = req.headers['x-correlation-id'];
                await this.draftService.patchDraftSection(id, 'profile', req.body, expectedUpdatedAt, correlationId);
                res.json({ success: true, message: 'Student profile draft updated successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.patchParents = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const expectedUpdatedAt = req.headers['x-expected-updated-at'] || req.body.expected_updated_at;
                if (!expectedUpdatedAt) {
                    return res
                        .status(400)
                        .json({
                        error: 'x-expected-updated-at header/expected_updated_at attribute is required',
                    });
                }
                const correlationId = req.headers['x-correlation-id'];
                await this.draftService.patchDraftSection(id, 'parents', req.body, expectedUpdatedAt, correlationId);
                res.json({ success: true, message: 'Parents draft details updated successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.patchEducation = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const expectedUpdatedAt = req.headers['x-expected-updated-at'] || req.body.expected_updated_at;
                if (!expectedUpdatedAt) {
                    return res
                        .status(400)
                        .json({
                        error: 'x-expected-updated-at header/expected_updated_at attribute is required',
                    });
                }
                const correlationId = req.headers['x-correlation-id'];
                await this.draftService.patchDraftSection(id, 'education', req.body, expectedUpdatedAt, correlationId);
                res.json({ success: true, message: 'Previous education draft updated successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.patchPreferences = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const expectedUpdatedAt = req.headers['x-expected-updated-at'] || req.body.expected_updated_at;
                if (!expectedUpdatedAt) {
                    return res
                        .status(400)
                        .json({
                        error: 'x-expected-updated-at header/expected_updated_at attribute is required',
                    });
                }
                const correlationId = req.headers['x-correlation-id'];
                await this.draftService.patchDraftSection(id, 'preferences', req.body, expectedUpdatedAt, correlationId);
                res.json({ success: true, message: 'Preferences draft details updated successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.patchDeclaration = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const expectedUpdatedAt = req.headers['x-expected-updated-at'] || req.body.expected_updated_at;
                if (!expectedUpdatedAt) {
                    return res
                        .status(400)
                        .json({
                        error: 'x-expected-updated-at header/expected_updated_at attribute is required',
                    });
                }
                const correlationId = req.headers['x-correlation-id'];
                await this.draftService.patchDraftSection(id, 'declaration', req.body, expectedUpdatedAt, correlationId);
                res.json({ success: true, message: 'Declaration draft signed successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.submit = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const roles = (0, rbac_middleware_1.getEffectiveRoles)(req.context?.user?.roles ?? []);
                const role = roles.includes('PARENT')
                    ? 'PARENT'
                    : req.context?.user?.roles?.[0] || 'counselor';
                const performedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.appService.submitApplication(id, req.body, role, performedBy, correlationId);
                res.json({ success: true, application: data, message: 'Application submitted successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getTimeline = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const data = await this.appService.getTimeline(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getProgress = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceAccess(req, id);
                const data = await this.progressService.getProgress(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.deleteDraft = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const correlationId = req.headers['x-correlation-id'];
                await this.draftService.deleteDraft(id, correlationId);
                res.json({ success: true, message: 'Application draft deleted successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.transition = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const { to_status, notes, event } = req.body;
                const role = req.context?.user?.roles?.[0] || 'counselor';
                const performedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                if (event) {
                    const data = await this.workflowOrchestrator.publish(event, id, {
                        userId: performedBy,
                        role,
                        correlationId,
                        notes,
                        ipAddress: req.ip,
                        browser: req.headers['user-agent'],
                        schoolId: req.context?.user?.school_id,
                        academicYearId: req.headers['x-academic-year-id'],
                    });
                    res.json({ success: true, application: data, message: 'Workflow event processed' });
                    return;
                }
                const data = await this.workflowService.transitionTo(id, to_status, role, performedBy, notes, correlationId);
                res.json({
                    success: true,
                    application: data,
                    message: 'Application transitioned successfully',
                });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.review = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const { remark } = req.body;
                const role = req.context?.user?.roles?.[0] || 'ADMISSION_OFFICER';
                const performedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.workflowOrchestrator.publish('APPLICATION_REVIEWED', id, {
                    userId: performedBy,
                    role,
                    correlationId,
                    notes: remark,
                    ipAddress: req.ip,
                    browser: req.headers['user-agent'],
                    schoolId: req.context?.user?.school_id,
                    academicYearId: req.headers['x-academic-year-id'],
                });
                res.json({ success: true, application: data, message: 'Application reviewed' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.approve = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const { remark } = req.body;
                const role = req.context?.user?.roles?.[0] || 'PRINCIPAL';
                const performedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.workflowOrchestrator.publish('APPLICATION_APPROVED', id, {
                    userId: performedBy,
                    role,
                    correlationId,
                    notes: remark,
                    ipAddress: req.ip,
                    browser: req.headers['user-agent'],
                    schoolId: req.context?.user?.school_id,
                    academicYearId: req.headers['x-academic-year-id'],
                });
                res.json({ success: true, application: data, message: 'Application approved' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.reject = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const { reason, remark } = req.body;
                const rejectionReason = reason ?? remark ?? '';
                if (!rejectionReason) {
                    return res.status(400).json({ error: 'Rejection reason is required' });
                }
                const role = req.context?.user?.roles?.[0] || 'ADMISSION_OFFICER';
                const performedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.appService.rejectApplication(id, performedBy, rejectionReason, role, correlationId);
                res.json({ success: true, application: data, message: 'Application rejected' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.verifyDocuments = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const { remark } = req.body;
                const role = req.context?.user?.roles?.[0] || 'ADMISSION_OFFICER';
                const performedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.appService.verifyDocuments(id, performedBy, remark ?? '', role, correlationId);
                res.json({ success: true, application: data, message: 'Documents verified' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
    async checkFlags(req) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const isCrmActive = await this.flagService.isEnabled('admission', 'admission_crm', envMode, schoolId);
        const isAppActive = await this.flagService.isEnabled('admission', 'application_management', envMode, schoolId);
        if (!isCrmActive || !isAppActive) {
            throw new PermissionError_1.PermissionError('Feature Disabled: application_management');
        }
    }
    async enforceAccess(req, applicationId) {
        const user = req.context?.user;
        if (!user) {
            throw new PermissionError_1.PermissionError('Unauthorized');
        }
        const roles = (0, rbac_middleware_1.getEffectiveRoles)(user.roles);
        if (roles.includes('ADMIN') ||
            roles.includes('ADMISSION_OFFICER') ||
            roles.includes('COUNSELOR')) {
            return;
        }
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
            return;
        }
        if (!user.permissions?.includes('admission.application.view') &&
            !user.permissions?.includes('admission.review')) {
            throw new PermissionError_1.PermissionError('Forbidden: Insufficient Permissions');
        }
    }
}
exports.ApplicationController = ApplicationController;
