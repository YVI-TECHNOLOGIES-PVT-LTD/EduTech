"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationController = void 0;
const EvaluationRepository_1 = require("../repositories/EvaluationRepository");
const EvaluationService_1 = require("../services/EvaluationService");
const EvaluationWorkflowService_1 = require("../services/EvaluationWorkflowService");
const EvaluationValidator_1 = require("../validators/EvaluationValidator");
class EvaluationController {
    static async listSessions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const { status } = req.query;
            const data = await EvaluationController.repo.listSessions(schoolId, status ? String(status) : undefined);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list evaluation sessions.' });
        }
    }
    static async getSessionById(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await EvaluationController.repo.findSessionById(id, schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch session details.' });
        }
    }
    static async startSession(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Authentication details missing.' });
            const validated = EvaluationValidator_1.EvaluationValidator.validateStart(req.body);
            const session = await EvaluationController.service.startEvaluationSession(schoolId, userId, validated);
            return res.status(201).json(session);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to start evaluation session.' });
        }
    }
    static async evaluateQuestion(req, res) {
        try {
            const { id } = req.params; // Session ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Authentication details missing.' });
            const validated = EvaluationValidator_1.EvaluationValidator.validateQuestionScore(req.body);
            const result = await EvaluationController.service.evaluateQuestion(id, schoolId, userId, validated);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to evaluate question.' });
        }
    }
    static async transitionWorkflow(req, res) {
        try {
            const { id } = req.params; // Session ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Authentication details missing.' });
            const { target_status } = req.body;
            const session = await EvaluationController.workflow.transitionSessionWorkflow(id, schoolId, userId, target_status);
            return res.status(200).json(session);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to transition workflow status.' });
        }
    }
}
exports.EvaluationController = EvaluationController;
EvaluationController.repo = new EvaluationRepository_1.EvaluationRepository();
EvaluationController.service = new EvaluationService_1.EvaluationService();
EvaluationController.workflow = new EvaluationWorkflowService_1.EvaluationWorkflowService();
exports.default = EvaluationController;
