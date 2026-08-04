"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamAnalyticsController = void 0;
const examAnalytics_service_1 = require("../services/examAnalytics.service");
exports.ExamAnalyticsController = {
    async getOverview(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getExamOverview(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getGrades(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getGradeDistribution(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getSubjects(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getSubjectPerformance(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getTopPerformers(req, res) {
        try {
            const { examId, limit } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getTopPerformers(examId, Number(limit) || 5);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getCompliance(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getComplianceReport(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getSectionAnalytics(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getSectionAnalytics(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getAuditTrails(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examAnalytics_service_1.ExamAnalyticsService.getAuditTrails(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
