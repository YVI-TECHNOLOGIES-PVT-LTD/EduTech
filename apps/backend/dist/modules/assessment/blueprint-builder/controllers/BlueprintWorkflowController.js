"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintWorkflowController = void 0;
const BlueprintWorkflowService_1 = require("../services/BlueprintWorkflowService");
class BlueprintWorkflowController {
    static async transitionBlueprint(req, res) {
        try {
            const { id } = req.params; // Blueprint ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const result = await BlueprintWorkflowController.workflowService.transitionStatus(id, schoolId, userId, req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to transition blueprint status.' });
        }
    }
}
exports.BlueprintWorkflowController = BlueprintWorkflowController;
BlueprintWorkflowController.workflowService = new BlueprintWorkflowService_1.BlueprintWorkflowService();
exports.default = BlueprintWorkflowController;
