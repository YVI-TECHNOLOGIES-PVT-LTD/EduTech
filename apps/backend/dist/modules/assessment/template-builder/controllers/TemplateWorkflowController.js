"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateWorkflowController = void 0;
const TemplateWorkflowService_1 = require("../services/TemplateWorkflowService");
class TemplateWorkflowController {
    static async transitionTemplate(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const result = await TemplateWorkflowController.workflowService.transitionStatus(id, schoolId, userId, req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to transition template status.' });
        }
    }
}
exports.TemplateWorkflowController = TemplateWorkflowController;
TemplateWorkflowController.workflowService = new TemplateWorkflowService_1.TemplateWorkflowService();
exports.default = TemplateWorkflowController;
