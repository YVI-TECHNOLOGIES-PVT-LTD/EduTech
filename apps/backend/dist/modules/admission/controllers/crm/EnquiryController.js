"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("./ControllerErrorHandler");
const admission_service_1 = require("../../admission.service");
class EnquiryController {
    constructor(enquiryService, flagService) {
        this.enquiryService = enquiryService;
        this.flagService = flagService;
        this.create = async (req, res) => {
            try {
                await this.checkFlags(req);
                let schoolId = req.context?.user?.school_id;
                let academicYearId = req.headers['x-academic-year-id'] || req.body.academic_year_id;
                if (!schoolId || !academicYearId) {
                    const resolved = await admission_service_1.AdmissionService.resolveContext();
                    if (!schoolId)
                        schoolId = resolved.school_id;
                    if (!academicYearId)
                        academicYearId = resolved.academic_year_id || '';
                }
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.enquiryService.createEnquiry(schoolId, academicYearId, req.body, correlationId);
                const referenceCode = `ENQ-2026-${data.id.slice(0, 8).toUpperCase()}`;
                res.status(201).json({
                    ...data,
                    id: data.id,
                    reference_code: referenceCode,
                    reference: referenceCode,
                });
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
                const data = await this.enquiryService.updateEnquiry(id, req.body, correlationId);
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
                const data = await this.enquiryService.getEnquiryById(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.list = async (req, res) => {
            try {
                await this.checkFlags(req);
                let schoolId = req.context?.user?.school_id;
                if (!schoolId) {
                    const resolved = await admission_service_1.AdmissionService.resolveContext();
                    schoolId = resolved.school_id;
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const search = req.query.search || undefined;
                const sortColumn = req.query.sort_column || undefined;
                const sortOrder = req.query.sort_order || undefined;
                const { page: _p, limit: _l, search: _s, sort_column: _sc, sort_order: _so, ...filters } = req.query;
                const data = await this.enquiryService.listEnquiries(schoolId, page, limit, filters, search, sortColumn, sortOrder);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.softDelete = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const correlationId = req.headers['x-correlation-id'];
                await this.enquiryService.deleteEnquiry(id, correlationId);
                res.json({ success: true, message: 'Enquiry deleted successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.convert = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                const correlationId = req.headers['x-correlation-id'];
                const userId = req.context?.user?.id || null;
                const { leadId, applicationId } = await this.enquiryService.convertToApplication(id, correlationId, userId);
                res.json({
                    success: true,
                    lead_id: leadId,
                    application_id: applicationId,
                    message: 'Enquiry converted to application successfully',
                });
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
        const isEnqActive = await this.flagService.isEnabled('admission', 'enquiry_management', envMode, schoolId);
        if (!isCrmActive || !isEnqActive) {
            throw new PermissionError_1.PermissionError('Feature Disabled: enquiry_management');
        }
    }
}
exports.EnquiryController = EnquiryController;
