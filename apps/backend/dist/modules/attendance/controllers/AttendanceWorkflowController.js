"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceWorkflowController = void 0;
const AttendanceWorkflowService_1 = require("../services/AttendanceWorkflowService");
const AttendanceValidator_1 = require("../validators/AttendanceValidator");
class AttendanceWorkflowController {
    static async transitionSession(req, res) {
        try {
            const userId = req.context?.user?.id;
            if (!userId)
                return res.status(400).json({ error: 'Context details missing.' });
            const validated = AttendanceValidator_1.AttendanceValidator.validateTransitionWorkflow(req.body);
            const session = await AttendanceWorkflowController.workflowService.transitionSessionWorkflow(validated.session_id, validated.decision, userId, validated.comments || undefined);
            return res.status(200).json(session);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to transition workflow.' });
        }
    }
}
exports.AttendanceWorkflowController = AttendanceWorkflowController;
AttendanceWorkflowController.workflowService = new AttendanceWorkflowService_1.AttendanceWorkflowService();
exports.default = AttendanceWorkflowController;
