"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateAnalyticsController = void 0;
const TemplateAnalyticsService_1 = require("../services/TemplateAnalyticsService");
class TemplateAnalyticsController {
    static async getMetrics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const metrics = await TemplateAnalyticsController.analyticsService.getMetrics(schoolId);
            return res.status(200).json(metrics);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch metrics.' });
        }
    }
}
exports.TemplateAnalyticsController = TemplateAnalyticsController;
TemplateAnalyticsController.analyticsService = new TemplateAnalyticsService_1.TemplateAnalyticsService();
exports.default = TemplateAnalyticsController;
