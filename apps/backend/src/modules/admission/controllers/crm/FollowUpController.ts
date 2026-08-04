import { Request, Response } from 'express';
import { FollowUpService } from '../../services/crm/FollowUpService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from './ControllerErrorHandler';

export class FollowUpController {
    constructor(
        private readonly followupService: FollowUpService,
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

    public create = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const createdBy = req.context?.user?.id;
            if (!createdBy) throw new Error('User context not found');

            const correlationId = req.headers['x-correlation-id'] as string;
            const data = await this.followupService.scheduleFollowup(req.body, createdBy, correlationId);
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public list = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortColumn = req.query.sort_column as string || undefined;
            const sortOrder = req.query.sort_order as 'asc' | 'desc' || undefined;

            const filters: { leadId?: string; status?: string } = {};
            if (req.query.lead_id) filters.leadId = req.query.lead_id as string;
            if (req.query.status) filters.status = req.query.status as string;

            const data = await this.followupService.listFollowups(filters, page, limit, sortColumn, sortOrder);
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
            const data = await this.followupService.updateFollowup(id, req.body, correlationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
