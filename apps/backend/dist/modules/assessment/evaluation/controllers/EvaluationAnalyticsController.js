"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationAnalyticsController = void 0;
const EvaluationAnalyticsService_1 = require("../services/EvaluationAnalyticsService");
class EvaluationAnalyticsController {
    static async getMetrics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const metrics = await EvaluationAnalyticsController.service.getDashboardMetrics(schoolId);
            return res.status(200).json(metrics);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to resolve metrics.' });
        }
    }
}
exports.EvaluationAnalyticsController = EvaluationAnalyticsController;
EvaluationAnalyticsController.service = new EvaluationAnalyticsService_1.EvaluationAnalyticsService();
exports.default = EvaluationAnalyticsController;
