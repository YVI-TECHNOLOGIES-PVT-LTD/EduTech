"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamQuestionPaperController = void 0;
const examQuestionPaper_service_1 = require("../services/examQuestionPaper.service");
exports.ExamQuestionPaperController = {
    async upload(req, res) {
        try {
            const { examScheduleId, fileUrl, fileName, status } = req.body;
            const userId = req.context.user.id;
            if (!examScheduleId || !fileUrl || !fileName) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            const data = await examQuestionPaper_service_1.ExamQuestionPaperService.uploadPaper(examScheduleId, userId, fileUrl, fileName, status);
            res.status(201).json(data);
        }
        catch (err) {
            console.error("QP Upload Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    async lock(req, res) {
        try {
            const { examScheduleId } = req.body;
            const userId = req.context.user.id;
            // Only Admin (Optional: Faculty Lead?)
            if (!req.context.user.roles.includes('ADMIN')) {
                return res.status(403).json({ error: "Only admins can lock question papers." });
            }
            const data = await examQuestionPaper_service_1.ExamQuestionPaperService.lockPaper(examScheduleId, userId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async list(req, res) {
        try {
            const { examScheduleId } = req.query;
            if (!examScheduleId)
                return res.status(400).json({ error: "Exam Schedule ID required" });
            const data = await examQuestionPaper_service_1.ExamQuestionPaperService.getPapers(examScheduleId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
