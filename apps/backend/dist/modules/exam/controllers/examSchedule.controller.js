"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamScheduleController = void 0;
const examSchedule_service_1 = require("../services/examSchedule.service");
const examNotification_service_1 = require("../services/examNotification.service");
exports.ExamScheduleController = {
    async updateSchedule(req, res) {
        try {
            const { id } = req.params;
            const payload = req.body;
            // Basic ID check
            if (!id)
                return res.status(400).json({ error: "Schedule ID missing" });
            const updated = await examSchedule_service_1.ExamScheduleService.updateSchedule(id, payload);
            res.json(updated);
        }
        catch (err) {
            console.error("Update Schedule Error:", err);
            // Handle duplicate constraint error
            if (err.code === '23505' || err.code === '409') {
                return res.status(409).json({ error: err.message || "Schedule conflict." });
            }
            res.status(500).json({ error: err.message });
        }
    },
    async createSchedule(req, res) {
        try {
            const { exam_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks } = req.body;
            if (!exam_id || !subject_id || !exam_date || !start_time || !end_time) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            // Simple validation for time
            if (start_time >= end_time) {
                return res.status(400).json({ error: "End time must be after start time" });
            }
            const schedule = await examSchedule_service_1.ExamScheduleService.createSchedule({
                exam_id,
                subject_id,
                exam_date,
                start_time,
                end_time,
                max_marks,
                passing_marks
            });
            res.status(201).json(schedule);
            // Hook: Notify
            if (schedule && schedule.id) {
                examNotification_service_1.ExamNotificationService.notifySchedulePublished(schedule.id);
            }
        }
        catch (err) {
            console.error("Create Schedule Error:", err);
            // Handle duplicate constraint error
            if (err.code === '23505') {
                return res.status(409).json({ error: "Schedule already exists for this subject in this exam" });
            }
            if (err.code === '409') {
                return res.status(409).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    },
    async getSchedules(req, res) {
        try {
            const { examId } = req.query;
            if (!examId) {
                return res.status(400).json({ error: "examId is required" });
            }
            const schedules = await examSchedule_service_1.ExamScheduleService.getSchedulesByExam(examId);
            res.json(schedules);
        }
        catch (err) {
            console.error("Get Schedules Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
};
