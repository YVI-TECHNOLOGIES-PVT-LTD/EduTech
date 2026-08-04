"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const FinanceEngine_1 = require("../services/FinanceEngine");
const FinanceExceptions_1 = require("../errors/FinanceExceptions");
class FinanceController {
    /**
     * Resolves the fee preview DTO for a given application ID.
     */
    static async getFeePreview(req, res) {
        try {
            const { applicationId } = req.params;
            const preview = await FinanceEngine_1.FinanceEngine.getFeePreview(applicationId);
            res.json(preview);
        }
        catch (error) {
            console.error("[FinanceController.getFeePreview] Error resolving fee preview:", error);
            // Map custom domain exceptions to standard FinanceApiErrorDto and status codes
            if (error instanceof FinanceExceptions_1.ApplicantNotFoundException) {
                return res.status(404).json({
                    code: 'APPLICANT_NOT_FOUND',
                    message: error.message
                });
            }
            if (error instanceof FinanceExceptions_1.ClassMappingException) {
                return res.status(422).json({
                    code: 'CLASS_MAPPING_ERROR',
                    message: error.message
                });
            }
            if (error instanceof FinanceExceptions_1.StructureNotFoundException) {
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
exports.FinanceController = FinanceController;
