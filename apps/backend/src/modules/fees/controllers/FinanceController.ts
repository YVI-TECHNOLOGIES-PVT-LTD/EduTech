import { Request, Response } from 'express';
import { FinanceEngine } from '../services/FinanceEngine';
import { ApplicantNotFoundException, ClassMappingException, StructureNotFoundException } from '../errors/FinanceExceptions';

export class FinanceController {
    /**
     * Resolves the fee preview DTO for a given application ID.
     */
    public static async getFeePreview(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;
            const preview = await FinanceEngine.getFeePreview(applicationId);
            res.json(preview);
        } catch (error: any) {
            console.error("[FinanceController.getFeePreview] Error resolving fee preview:", error);
            
            // Map custom domain exceptions to standard FinanceApiErrorDto and status codes
            if (error instanceof ApplicantNotFoundException) {
                return res.status(404).json({
                    code: 'APPLICANT_NOT_FOUND',
                    message: error.message
                });
            }
            if (error instanceof ClassMappingException) {
                return res.status(422).json({
                    code: 'CLASS_MAPPING_ERROR',
                    message: error.message
                });
            }
            if (error instanceof StructureNotFoundException) {
                return res.status(404).json({
                    code: 'STRUCTURE_NOT_FOUND',
                    message: error.message
                });
            }
            
            // Default 500 error
            res.status(500).json({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred while resolving fee preview.',
                details: error.message
            });
        }
    }
}
