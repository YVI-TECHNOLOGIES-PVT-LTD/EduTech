"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevaluationController = void 0;
const RevaluationRepository_1 = require("../repositories/RevaluationRepository");
const RevaluationService_1 = require("../services/RevaluationService");
const EvaluationValidator_1 = require("../validators/EvaluationValidator");
class RevaluationController {
    static async listRequests(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await RevaluationController.repo.listRequests(schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list revaluation requests.' });
        }
    }
    static async apply(req, res) {
        try {
            const validated = EvaluationValidator_1.EvaluationValidator.validateRevaluation(req.body);
            const data = await RevaluationController.service.applyForRevaluation(validated.attempt_id, validated.student_id, validated.reason);
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to file revaluation request.' });
        }
    }
    static async approve(req, res) {
        try {
            const { id } = req.params; // Request ID
            const { remarks } = req.body;
            const data = await RevaluationController.service.approveRevaluation(id, remarks);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to approve revaluation.' });
        }
    }
}
exports.RevaluationController = RevaluationController;
RevaluationController.repo = new RevaluationRepository_1.RevaluationRepository();
RevaluationController.service = new RevaluationService_1.RevaluationService();
exports.default = RevaluationController;
