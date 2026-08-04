"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApplicationController = void 0;
const ControllerErrorHandler_1 = require("../crm/ControllerErrorHandler");
class PublicApplicationController {
    constructor(publicApplicationService) {
        this.publicApplicationService = publicApplicationService;
        this.apply = async (req, res) => {
            try {
                const correlationId = req.headers['x-correlation-id'];
                const result = await this.publicApplicationService.applyOnline(req.body, correlationId);
                res.status(201).json({
                    success: true,
                    application_id: result.applicationId,
                    enquiry_id: result.enquiryId,
                    lead_id: result.leadId,
                    user_id: result.userId,
                    message: 'Application submitted successfully. You may login to track progress.',
                });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
}
exports.PublicApplicationController = PublicApplicationController;
