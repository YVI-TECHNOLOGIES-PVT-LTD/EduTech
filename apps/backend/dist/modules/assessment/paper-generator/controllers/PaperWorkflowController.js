"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperWorkflowController = void 0;
const PaperWorkflowService_1 = require("../services/PaperWorkflowService");
const PaperValidator_1 = require("../validators/PaperValidator");
class PaperWorkflowController {
    static async transitionStatus(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const validated = PaperValidator_1.PaperValidator.validateWorkflow(req.body);
            const result = await PaperWorkflowController.workflowService.transitionStatus(id, schoolId, userId, validated.target_status, validated.transition_reason);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to transition paper status.' });
        }
    }
}
exports.PaperWorkflowController = PaperWorkflowController;
PaperWorkflowController.workflowService = new PaperWorkflowService_1.PaperWorkflowService();
exports.default = PaperWorkflowController;
