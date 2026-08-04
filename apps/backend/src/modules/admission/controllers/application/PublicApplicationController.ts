import { Request, Response } from 'express';
import { PublicApplicationService } from '../../services/application/PublicApplicationService';
import { handleControllerError } from '../crm/ControllerErrorHandler';

export class PublicApplicationController {
    constructor(private readonly publicApplicationService: PublicApplicationService) {}

    public apply = async (req: Request, res: Response) => {
        try {
            const correlationId = req.headers['x-correlation-id'] as string;
            const result = await this.publicApplicationService.applyOnline(req.body, correlationId);
            res.status(201).json({
                success: true,
                application_id: result.applicationId,
                enquiry_id: result.enquiryId,
                lead_id: result.leadId,
                user_id: result.userId,
                message: 'Application submitted successfully. You may login to track progress.',
            });
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
