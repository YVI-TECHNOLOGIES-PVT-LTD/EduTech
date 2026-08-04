"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("./ControllerErrorHandler");
class LeadController {
    constructor(leadService, assignmentService, flagService) {
        this.leadService = leadService;
        this.assignmentService = assignmentService;
        this.flagService = flagService;
        this.list = async (req, res) => {
            try {
                await this.checkFlags(req);
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const sortColumn = req.query.sort_column || undefined;
                const sortOrder = req.query.sort_order || undefined;
                const filters = {};
                if (req.query.counselor_id)
                    filters.counselorId = req.query.counselor_id;
                if (req.query.status)
                    filters.status = req.query.status;
                const data = await this.leadService.listLeads(filters, page, limit, sortColumn, sortOrder);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getById = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const data = await this.leadService.getLeadById(id);
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
                const data = await this.leadService.updateLead(id, req.body, correlationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.assign = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const { strategy, counselor_id, counselorId, updated_at, updatedAt, reassign } = req.body;
                const resolvedCounselorId = counselor_id || counselorId;
                const resolvedUpdatedAt = updated_at || updatedAt;
                const correlationId = req.headers['x-correlation-id'];
                const userId = req.context?.user?.id || null;
                const ip = req.ip || req.socket.remoteAddress || undefined;
                const browser = req.headers['user-agent'] || undefined;
                const data = await this.assignmentService.assignCounselor(id, strategy || 'manual', {
                    counselorId: resolvedCounselorId,
                    updatedAt: resolvedUpdatedAt,
                    reassign: !!reassign,
                    ip,
                    browser
                }, correlationId, userId);
                const message = (resolvedCounselorId && data.counselorId === resolvedCounselorId)
                    ? 'Lead already assigned'
                    : 'Counselor assigned successfully';
                res.json({ success: true, lead: data, message });
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
exports.LeadController = LeadController;
