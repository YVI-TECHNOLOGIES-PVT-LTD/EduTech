"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintAnalyticsController = void 0;
const BlueprintAnalyticsService_1 = require("../services/BlueprintAnalyticsService");
class BlueprintAnalyticsController {
    static async getMetrics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const metrics = await BlueprintAnalyticsController.analyticsService.getMetrics(schoolId);
            return res.status(200).json(metrics);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to resolve metrics.' });
        }
    }
}
exports.BlueprintAnalyticsController = BlueprintAnalyticsController;
BlueprintAnalyticsController.analyticsService = new BlueprintAnalyticsService_1.BlueprintAnalyticsService();
exports.default = BlueprintAnalyticsController;
