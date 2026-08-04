import { Request, Response } from 'express';
import { VisitorService } from '../../services/crm/VisitorService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from './ControllerErrorHandler';

export class VisitorController {
    constructor(
        private readonly visitorService: VisitorService,
        private readonly flagService: FeatureFlagService
    ) {}

    private async checkFlags(req: Request) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const isCrmActive = await this.flagService.isEnabled('admission', 'admission_crm', envMode, schoolId);
        const isVisitorActive = await this.flagService.isEnabled('admission', 'visitor_management', envMode, schoolId);
        if (!isCrmActive || !isVisitorActive) {
            throw new PermissionError('Feature Disabled: visitor_management');
        }
    }

    public create = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const schoolId = req.context?.user?.school_id;
            const createdBy = req.context?.user?.id;
            if (!schoolId || !createdBy) throw new Error('User or School context not found');

            const correlationId = req.headers['x-correlation-id'] as string;
            const data = await this.visitorService.checkIn(schoolId, req.body, createdBy, correlationId);
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public list = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) throw new Error('School context not found');

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string || undefined;
            const sortColumn = req.query.sort_column as string || undefined;
            const sortOrder = req.query.sort_order as 'asc' | 'desc' || undefined;

            const { page: _p, limit: _l, search: _s, sort_column: _sc, sort_order: _so, ...filters } = req.query;

            const data = await this.visitorService.listVisitors(
                schoolId,
                page,
                limit,
                filters,
                search,
                sortColumn,
                sortOrder
            );
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
            const data = await this.visitorService.checkOut(id, req.body, correlationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
