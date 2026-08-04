"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const ResultWorkflowService_1 = require("../services/ResultWorkflowService");
const ResultValidator_1 = require("../validators/ResultValidator");
class WorkflowController {
    static async transitionStatus(req, res) {
        try {
            const { id } = req.params; // Session ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials missing.' });
            const validated = ResultValidator_1.ResultValidator.validateWorkflow(req.body);
            const result = await WorkflowController.service.transitionWorkflow(id, schoolId, userId, validated.target_status, validated.comments || undefined);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to transition workflow status.' });
        }
    }
}
exports.WorkflowController = WorkflowController;
WorkflowController.service = new ResultWorkflowService_1.ResultWorkflowService();
exports.default = WorkflowController;
