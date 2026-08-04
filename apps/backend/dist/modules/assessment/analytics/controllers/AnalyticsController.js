"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const AnalyticsRepository_1 = require("../repositories/AnalyticsRepository");
const AnalyticsValidator_1 = require("../validators/AnalyticsValidator");
class AnalyticsController {
    static async saveSnapshot(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context credentials missing.' });
            const validated = AnalyticsValidator_1.AnalyticsValidator.validateSnapshot(req.body);
            const data = await AnalyticsController.repo.saveSnapshot(schoolId, validated);
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to capture snapshot.' });
        }
    }
    static async listSnapshots(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context credentials missing.' });
            const { type } = req.query;
            const data = await AnalyticsController.repo.getSnapshots(schoolId, type ? String(type) : undefined);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list snapshots.' });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
AnalyticsController.repo = new AnalyticsRepository_1.AnalyticsRepository();
exports.default = AnalyticsController;
