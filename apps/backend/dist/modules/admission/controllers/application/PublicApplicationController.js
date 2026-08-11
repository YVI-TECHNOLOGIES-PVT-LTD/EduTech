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
                    application_number: result.applicationNumber,
                    enquiry_id: result.enquiryId,
                    lead_id: result.leadId,
                    user_id: result.userId,
                    message: 'Application submitted successfully. You may login to track progress.',
                });
            }
            catch (err) {
                console.error('[PUBLIC-APPLY ERROR] Name:', err?.name);
                console.error('[PUBLIC-APPLY ERROR] Message:', err?.message);
                if (err?.code)
                    console.error('[PUBLIC-APPLY ERROR] Prisma Code:', err?.code);
                if (err?.meta)
                    console.error('[PUBLIC-APPLY ERROR] Prisma Meta:', err?.meta);
                console.error('[PUBLIC-APPLY ERROR] Stack:', err?.stack);
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
}
exports.PublicApplicationController = PublicApplicationController;
