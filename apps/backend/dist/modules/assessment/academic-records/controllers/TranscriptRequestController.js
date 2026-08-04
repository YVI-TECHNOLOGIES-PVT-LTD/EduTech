"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptRequestController = void 0;
const TranscriptRequestRepository_1 = require("../repositories/TranscriptRequestRepository");
const TranscriptService_1 = require("../services/TranscriptService");
class TranscriptRequestController {
    static async createRequest(req, res) {
        try {
            const { student_id } = req.body;
            const data = await TranscriptRequestController.repo.createRequest(student_id);
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to submit transcript request.' });
        }
    }
    static async generateTranscript(req, res) {
        try {
            const { student_id } = req.body;
            const userId = req.context?.user?.id;
            if (!userId)
                return res.status(400).json({ error: 'Context details missing.' });
            const data = await TranscriptRequestController.transcriptService.generateOfficialTranscript(student_id, userId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to generate official transcript.' });
        }
    }
}
exports.TranscriptRequestController = TranscriptRequestController;
TranscriptRequestController.repo = new TranscriptRequestRepository_1.TranscriptRequestRepository();
TranscriptRequestController.transcriptService = new TranscriptService_1.TranscriptService();
exports.default = TranscriptRequestController;
