import { Request, Response } from 'express';
import { LeadService } from '../../services/crm/LeadService';
import { CounselorAssignmentService } from '../../services/crm/CounselorAssignmentService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from './ControllerErrorHandler';

export class LeadController {
    constructor(
        private readonly leadService: LeadService,
        private readonly assignmentService: CounselorAssignmentService,
        private readonly flagService: FeatureFlagService
    ) {}

    private async checkFlags(req: Request) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const isCrmActive = await this.flagService.isEnabled('admission', 'admission_crm', envMode, schoolId);
        const isLeadActive = await this.flagService.isEnabled('admission', 'lead_management', envMode, schoolId);
        if (!isCrmActive || !isLeadActive) {
            throw new PermissionError('Feature Disabled: lead_management');
        }
    }

    public list = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortColumn = req.query.sort_column as string || undefined;
            const sortOrder = req.query.sort_order as 'asc' | 'desc' || undefined;

            const filters: { counselorId?: string; status?: string } = {};
            if (req.query.counselor_id) filters.counselorId = req.query.counselor_id as string;
            if (req.query.status) filters.status = req.query.status as string;

            const data = await this.leadService.listLeads(filters, page, limit, sortColumn, sortOrder);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getById = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const data = await this.leadService.getLeadById(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public update = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const correlationId = req.headers['x-correlation-id'] as string;
            const data = await this.leadService.updateLead(id, req.body, correlationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public assign = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            const { strategy, counselor_id, counselorId, updated_at, updatedAt, reassign } = req.body;
            const resolvedCounselorId = counselor_id || counselorId;
            const resolvedUpdatedAt = updated_at || updatedAt;
            const correlationId = req.headers['x-correlation-id'] as string;
            const userId = req.context?.user?.id || null;
            const ip = req.ip || req.socket.remoteAddress || undefined;
            const browser = (req.headers['user-agent'] as string) || undefined;

            const data = await this.assignmentService.assignCounselor(
                id,
                strategy || 'manual',
                { 
                    counselorId: resolvedCounselorId, 
                    updatedAt: resolvedUpdatedAt,
                    reassign: !!reassign,
                    ip,
                    browser
                },
                correlationId,
                userId
            );
            const message = (resolvedCounselorId && data.counselorId === resolvedCounselorId)
                ? 'Lead already assigned'
                : 'Counselor assigned successfully';
            res.json({ success: true, lead: data, message });
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
