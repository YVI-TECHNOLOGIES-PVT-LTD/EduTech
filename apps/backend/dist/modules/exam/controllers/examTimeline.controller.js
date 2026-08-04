"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamTimelineController = void 0;
const ExamTimelineProjection_service_1 = require("../services/ExamTimelineProjection.service");
exports.ExamTimelineController = {
    async getStudentTimeline(req, res) {
        try {
            // In a real app, studentId might be linked to the user context
            // For this design, we'll try to get it from context if available, or params
            const schoolId = req.context.user.school_id;
            const studentId = req.query.studentId;
            if (!studentId) {
                return res.status(400).json({ error: 'studentId is required as a query parameter' });
            }
            const timeline = await ExamTimelineProjection_service_1.ExamTimelineProjectionService.getStudentTimeline(studentId, schoolId);
            res.json(timeline);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getFacultyTimeline(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const userId = req.context.user.id;
            const projection = await ExamTimelineProjection_service_1.ExamTimelineProjectionService.getFacultyTimeline(userId, schoolId);
            res.json(projection);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
