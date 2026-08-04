"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionController = void 0;
const RiskPredictionService_1 = require("../services/RiskPredictionService");
class PredictionController {
    static async processRiskScore(req, res) {
        try {
            const { student_id } = req.body;
            const data = await PredictionController.service.processStudentRiskScore(student_id);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to process student risk score.' });
        }
    }
}
exports.PredictionController = PredictionController;
PredictionController.service = new RiskPredictionService_1.RiskPredictionService();
exports.default = PredictionController;
