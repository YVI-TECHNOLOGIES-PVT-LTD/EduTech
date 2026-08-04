"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeCalculationController = void 0;
const GradeCalculationService_1 = require("../services/GradeCalculationService");
const GradeCalculationRepository_1 = require("../repositories/GradeCalculationRepository");
class GradeCalculationController {
    static async calculateGrade(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials missing.' });
            const { attempt_id } = req.body;
            const data = await GradeCalculationController.service.calculateGrade(schoolId, attempt_id, userId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to calculate grade.' });
        }
    }
    static async getCalculationByAttempt(req, res) {
        try {
            const { attemptId } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await GradeCalculationController.repo.findByAttemptId(attemptId, schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch grade calculations.' });
        }
    }
}
exports.GradeCalculationController = GradeCalculationController;
GradeCalculationController.service = new GradeCalculationService_1.GradeCalculationService();
GradeCalculationController.repo = new GradeCalculationRepository_1.GradeCalculationRepository();
exports.default = GradeCalculationController;
