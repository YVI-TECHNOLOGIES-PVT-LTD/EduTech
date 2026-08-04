"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperStatisticsController = void 0;
const PaperStatisticsService_1 = require("../services/PaperStatisticsService");
class PaperStatisticsController {
    static async getMetrics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const metrics = await PaperStatisticsController.statsService.getMetrics(schoolId);
            return res.status(200).json(metrics);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch statistics.' });
        }
    }
}
exports.PaperStatisticsController = PaperStatisticsController;
PaperStatisticsController.statsService = new PaperStatisticsService_1.PaperStatisticsService();
exports.default = PaperStatisticsController;
