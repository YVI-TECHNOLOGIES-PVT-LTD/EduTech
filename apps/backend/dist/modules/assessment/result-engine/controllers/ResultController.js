"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultController = void 0;
const ResultRepository_1 = require("../repositories/ResultRepository");
const ResultCalculationService_1 = require("../services/ResultCalculationService");
const ResultValidator_1 = require("../validators/ResultValidator");
class ResultController {
    static async listSessions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await ResultController.repo.listSessions(schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list result sessions.' });
        }
    }
    static async createSession(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials missing.' });
            const validated = ResultValidator_1.ResultValidator.validateCreateSession(req.body);
            const session = await ResultController.repo.createSession(schoolId, validated, userId);
            return res.status(201).json(session);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to create session.' });
        }
    }
    static async calculateResults(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials missing.' });
            const validated = ResultValidator_1.ResultValidator.validateCalculate(req.body);
            const session = await ResultController.service.calculateSessionResults(validated.session_id, schoolId, userId);
            return res.status(200).json(session);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to calculate results.' });
        }
    }
}
exports.ResultController = ResultController;
ResultController.repo = new ResultRepository_1.ResultRepository();
ResultController.service = new ResultCalculationService_1.ResultCalculationService();
exports.default = ResultController;
