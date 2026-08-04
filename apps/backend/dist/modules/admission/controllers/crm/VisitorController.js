"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("./ControllerErrorHandler");
class VisitorController {
    constructor(visitorService, flagService) {
        this.visitorService = visitorService;
        this.flagService = flagService;
        this.create = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id;
                const createdBy = req.context?.user?.id;
                if (!schoolId || !createdBy)
                    throw new Error('User or School context not found');
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.visitorService.checkIn(schoolId, req.body, createdBy, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.list = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id;
                if (!schoolId)
                    throw new Error('School context not found');
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const search = req.query.search || undefined;
                const sortColumn = req.query.sort_column || undefined;
                const sortOrder = req.query.sort_order || undefined;
                const { page: _p, limit: _l, search: _s, sort_column: _sc, sort_order: _so, ...filters } = req.query;
                const data = await this.visitorService.listVisitors(schoolId, page, limit, filters, search, sortColumn, sortOrder);
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
                const data = await this.visitorService.checkOut(id, req.body, correlationId);
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
        const isVisitorActive = await this.flagService.isEnabled('admission', 'visitor_management', envMode, schoolId);
        if (!isCrmActive || !isVisitorActive) {
            throw new PermissionError_1.PermissionError('Feature Disabled: visitor_management');
        }
    }
}
exports.VisitorController = VisitorController;
