"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingController = void 0;
const RankingEngine_1 = require("../services/RankingEngine");
class RankingController {
    static async calculateRankings(req, res) {
        try {
            const { sessionId } = req.body;
            await RankingController.service.calculateCohortRankings(sessionId);
            return res.status(200).json({ message: 'Cohort rankings successfully calculated!' });
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to calculate rankings.' });
        }
    }
}
exports.RankingController = RankingController;
RankingController.service = new RankingEngine_1.RankingEngine();
exports.default = RankingController;
