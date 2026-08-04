"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionStatisticsController = void 0;
const QuestionAnalyticsService_1 = require("../services/QuestionAnalyticsService");
class QuestionStatisticsController {
    static async calculateQuestionStats(req, res) {
        try {
            const { question_snapshot_id } = req.body;
            const data = await QuestionStatisticsController.service.calculateQuestionStats(question_snapshot_id);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to calculate question stats.' });
        }
    }
}
exports.QuestionStatisticsController = QuestionStatisticsController;
QuestionStatisticsController.service = new QuestionAnalyticsService_1.QuestionAnalyticsService();
exports.default = QuestionStatisticsController;
