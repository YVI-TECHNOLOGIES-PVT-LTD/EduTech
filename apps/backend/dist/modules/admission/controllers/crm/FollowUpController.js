"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("./ControllerErrorHandler");
class FollowUpController {
    constructor(followupService, flagService) {
        this.followupService = followupService;
        this.flagService = flagService;
        this.create = async (req, res) => {
            try {
                await this.checkFlags(req);
                const createdBy = req.context?.user?.id;
                if (!createdBy)
                    throw new Error('User context not found');
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.followupService.scheduleFollowup(req.body, createdBy, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.list = async (req, res) => {
            try {
                await this.checkFlags(req);
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const sortColumn = req.query.sort_column || undefined;
                const sortOrder = req.query.sort_order || undefined;
                const filters = {};
                if (req.query.lead_id)
                    filters.leadId = req.query.lead_id;
                if (req.query.status)
                    filters.status = req.query.status;
                const data = await this.followupService.listFollowups(filters, page, limit, sortColumn, sortOrder);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.update = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.followupService.updateFollowup(id, req.body, correlationId);
                res.json(data);
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
        const isLeadActive = await this.flagService.isEnabled('admission', 'lead_management', envMode, schoolId);
        if (!isCrmActive || !isLeadActive) {
            throw new PermissionError_1.PermissionError('Feature Disabled: lead_management');
        }
    }
}
exports.FollowUpController = FollowUpController;
