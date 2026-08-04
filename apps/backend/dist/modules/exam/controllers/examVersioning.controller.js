"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamVersioningController = void 0;
const examVersioning_service_1 = require("../services/examVersioning.service");
exports.ExamVersioningController = {
    /**
     * Get all seating versions for an exam
     */
    async getSeatingVersions(req, res) {
        try {
            const { examId } = req.params;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examVersioning_service_1.ExamVersioningService.getSeatingVersions(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Get all result versions for an exam
     */
    async getResultVersions(req, res) {
        try {
            const { examId } = req.params;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examVersioning_service_1.ExamVersioningService.getResultVersions(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Restore a specific seating version
     */
    async restoreSeatingVersion(req, res) {
        try {
            const { examId, version } = req.params;
            const userId = req.context.user.id;
            if (!examId || !version)
                return res.status(400).json({ error: "Exam ID and Version Number required" });
            const result = await examVersioning_service_1.ExamVersioningService.restoreSeatingVersion(examId, parseInt(version), userId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
