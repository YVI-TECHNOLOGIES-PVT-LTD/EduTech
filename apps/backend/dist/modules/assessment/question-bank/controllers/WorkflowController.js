"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const QuestionWorkflowService_1 = require("../services/QuestionWorkflowService");
class WorkflowController {
    static async transitionQuestion(req, res) {
        try {
            const { id } = req.params; // Question ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const result = await WorkflowController.workflowService.transitionStatus(id, schoolId, userId, req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to transition question.' });
        }
    }
}
exports.WorkflowController = WorkflowController;
WorkflowController.workflowService = new QuestionWorkflowService_1.QuestionWorkflowService();
exports.default = WorkflowController;
