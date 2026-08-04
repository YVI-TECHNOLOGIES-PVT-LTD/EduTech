import { Request, Response } from 'express';
import { ApplicationService } from '../../services/application/ApplicationService';
import { DraftService } from '../../services/application/DraftService';
import { ApplicationWorkflowService } from '../../services/application/ApplicationWorkflowService';
import { ApplicationProgressService } from '../../services/application/ApplicationProgressService';
import { ApplicationWorkflowOrchestrator, type WorkflowEvent } from '../../services/application/ApplicationWorkflowOrchestrator';
import { PublicApplicationService } from '../../services/application/PublicApplicationService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from '../crm/ControllerErrorHandler';
import { getEffectiveRoles } from '../../../../rbac/rbac.middleware';

export class ApplicationController {
    constructor(
        private readonly appService: ApplicationService,
        private readonly draftService: DraftService,
        private readonly workflowService: ApplicationWorkflowService,
        private readonly progressService: ApplicationProgressService,
        private readonly workflowOrchestrator: ApplicationWorkflowOrchestrator,
        private readonly flagService: FeatureFlagService,
        private readonly publicApplicationService?: PublicApplicationService
    ) {}

    private async checkFlags(req: Request) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const isCrmActive = await this.flagService.isEnabled('admission', 'admission_crm', envMode, schoolId);
        const isAppActive = await this.flagService.isEnabled('admission', 'application_management', envMode, schoolId);
        if (!isCrmActive || !isAppActive) {
            throw new PermissionError('Feature Disabled: application_management');
        }
    }

    private async enforceAccess(req: Request, applicationId: string): Promise<void> {
        const user = req.context?.user;
        if (!user) {
            throw new PermissionError('Unauthorized');
        }
        const roles = getEffectiveRoles(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR')) {
            return;
        }
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
            return;
        }
        if (!user.permissions?.includes('admission.application.view') && !user.permissions?.includes('admission.review')) {
            throw new PermissionError('Forbidden: Insufficient Permissions');
        }
    }

    public listMine = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const user = req.context?.user;
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const applications = await this.appService.listForParent(user.id, user.email);
            const enriched = await Promise.all(
                applications.map(async app => {
                    const draft = await this.draftService.resumeDraft(app.id).catch(() => null);
                    const enquiry = draft?.enquiry ?? {};
                    return {
                        id: app.id,
                        status: app.status,
                        school_id: app.schoolId,
                        academic_year_id: app.academicYearId,
                        student_name: enquiry.student_name ?? enquiry.studentName ?? 'Applicant',
                        grade_applied_for: enquiry.grade_applied_for ?? enquiry.gradeAppliedFor ?? '',
                        parent_email: enquiry.parent_email ?? enquiry.parentEmail ?? user.email,
                        updated_at: app.updatedAt.toISOString(),
                        created_at: app.createdAt.toISOString(),
                    };
                })
            );
            res.json({ data: enriched, total: enriched.length });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public list = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const schoolId = (req.query.school_id as string) || req.context?.user?.school_id;
            if (!schoolId) {
                return res.status(400).json({ error: 'School context is required' });
            }
            const { status, page, limit, search } = req.query;
            const result = await this.appService.listForStaff(schoolId, {
                status: status as string | undefined,
                search: search as string | undefined,
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            });
            res.json(result);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getStats = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const schoolId = (req.query.school_id as string) || req.context?.user?.school_id;
            const stats = await this.appService.getStats(schoolId);
            res.json(stats);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public parentApply = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const user = req.context?.user;
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            if (!this.publicApplicationService) {
                return res.status(500).json({ error: 'Public application service not configured' });
            }
            const correlationId = req.headers['x-correlation-id'] as string;
            const result = await this.publicApplicationService.applyAsAuthenticatedParent(
                user.id,
                user.email,
                req.body,
                correlationId
            );
            res.status(201).json({
                success: true,
                application_id: result.applicationId,
                enquiry_id: result.enquiryId,
                lead_id: result.leadId,
                user_id: result.userId,
                message: 'Application submitted successfully.',
            });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public create = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const schoolId = req.context?.user?.school_id;
            const academicYearId = req.headers['x-academic-year-id'] as string || req.body.academic_year_id;
            const createdBy = req.context?.user?.id || null;
            if (!schoolId || !academicYearId) {
                throw new Error('School context and Academic Year context are required');
            }

            const correlationId = req.headers['x-correlation-id'] as string;
            const data = await this.appService.createApplication(
                schoolId,
                academicYearId,
                createdBy,
                req.body,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public resume = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const data = await this.draftService.resumeDraft(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public patchProfile = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const expectedUpdatedAt = req.headers['x-expected-updated-at'] as string || req.body.expected_updated_at;
            if (!expectedUpdatedAt) {
                return res.status(400).json({ error: 'x-expected-updated-at header/expected_updated_at attribute is required' });
            }

            const correlationId = req.headers['x-correlation-id'] as string;
            await this.draftService.patchDraftSection(id, 'profile', req.body, expectedUpdatedAt, correlationId);
            res.json({ success: true, message: 'Student profile draft updated successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public patchParents = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const expectedUpdatedAt = req.headers['x-expected-updated-at'] as string || req.body.expected_updated_at;
            if (!expectedUpdatedAt) {
                return res.status(400).json({ error: 'x-expected-updated-at header/expected_updated_at attribute is required' });
            }

            const correlationId = req.headers['x-correlation-id'] as string;
            await this.draftService.patchDraftSection(id, 'parents', req.body, expectedUpdatedAt, correlationId);
            res.json({ success: true, message: 'Parents draft details updated successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public patchEducation = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const expectedUpdatedAt = req.headers['x-expected-updated-at'] as string || req.body.expected_updated_at;
            if (!expectedUpdatedAt) {
                return res.status(400).json({ error: 'x-expected-updated-at header/expected_updated_at attribute is required' });
            }

            const correlationId = req.headers['x-correlation-id'] as string;
            await this.draftService.patchDraftSection(id, 'education', req.body, expectedUpdatedAt, correlationId);
            res.json({ success: true, message: 'Previous education draft updated successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public patchPreferences = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const expectedUpdatedAt = req.headers['x-expected-updated-at'] as string || req.body.expected_updated_at;
            if (!expectedUpdatedAt) {
                return res.status(400).json({ error: 'x-expected-updated-at header/expected_updated_at attribute is required' });
            }

            const correlationId = req.headers['x-correlation-id'] as string;
            await this.draftService.patchDraftSection(id, 'preferences', req.body, expectedUpdatedAt, correlationId);
            res.json({ success: true, message: 'Preferences draft details updated successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public patchDeclaration = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const expectedUpdatedAt = req.headers['x-expected-updated-at'] as string || req.body.expected_updated_at;
            if (!expectedUpdatedAt) {
                return res.status(400).json({ error: 'x-expected-updated-at header/expected_updated_at attribute is required' });
            }

            const correlationId = req.headers['x-correlation-id'] as string;
            await this.draftService.patchDraftSection(id, 'declaration', req.body, expectedUpdatedAt, correlationId);
            res.json({ success: true, message: 'Declaration draft signed successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public submit = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const roles = getEffectiveRoles(req.context?.user?.roles ?? []);
            const role = roles.includes('PARENT') ? 'PARENT' : (req.context?.user?.roles?.[0] || 'counselor');
            const performedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.appService.submitApplication(id, req.body, role, performedBy, correlationId);
            res.json({ success: true, application: data, message: 'Application submitted successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getTimeline = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const data = await this.appService.getTimeline(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getProgress = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceAccess(req, id);
            const data = await this.progressService.getProgress(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public deleteDraft = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const correlationId = req.headers['x-correlation-id'] as string;
            await this.draftService.deleteDraft(id, correlationId);
            res.json({ success: true, message: 'Application draft deleted successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public transition = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const { to_status, notes, event } = req.body;
            const role = req.context?.user?.roles?.[0] || 'counselor';
            const performedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            if (event) {
                const data = await this.workflowOrchestrator.publish(
                    event as WorkflowEvent,
                    id,
                    {
                        userId: performedBy,
                        role,
                        correlationId,
                        notes,
                        ipAddress: req.ip,
                        browser: req.headers['user-agent'],
                        schoolId: req.context?.user?.school_id,
                        academicYearId: req.headers['x-academic-year-id'] as string,
                    }
                );
                res.json({ success: true, application: data, message: 'Workflow event processed' });
                return;
            }

            const data = await this.workflowService.transitionTo(
                id,
                to_status,
                role,
                performedBy,
                notes,
                correlationId
            );
            res.json({ success: true, application: data, message: 'Application transitioned successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public review = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const { remark } = req.body;
            const role = req.context?.user?.roles?.[0] || 'ADMISSION_OFFICER';
            const performedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.workflowOrchestrator.publish('APPLICATION_REVIEWED', id, {
                userId: performedBy,
                role,
                correlationId,
                notes: remark,
                ipAddress: req.ip,
                browser: req.headers['user-agent'],
                schoolId: req.context?.user?.school_id,
                academicYearId: req.headers['x-academic-year-id'] as string,
            });
            res.json({ success: true, application: data, message: 'Application reviewed' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public approve = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const { remark } = req.body;
            const role = req.context?.user?.roles?.[0] || 'PRINCIPAL';
            const performedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.workflowOrchestrator.publish('APPLICATION_APPROVED', id, {
                userId: performedBy,
                role,
                correlationId,
                notes: remark,
                ipAddress: req.ip,
                browser: req.headers['user-agent'],
                schoolId: req.context?.user?.school_id,
                academicYearId: req.headers['x-academic-year-id'] as string,
            });
            res.json({ success: true, application: data, message: 'Application approved' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public reject = async (req: Request, res: Response) => {
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
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.appService.rejectApplication(id, performedBy, rejectionReason, role, correlationId);
            res.json({ success: true, application: data, message: 'Application rejected' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public verifyDocuments = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const { remark } = req.body;
            const role = req.context?.user?.roles?.[0] || 'ADMISSION_OFFICER';
            const performedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.appService.verifyDocuments(id, performedBy, remark ?? '', role, correlationId);
            res.json({ success: true, application: data, message: 'Documents verified' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
