"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamHallController = void 0;
const examHall_service_1 = require("../services/examHall.service");
exports.ExamHallController = {
    /**
     * GET /api/v1/exam-halls
     */
    async listHalls(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const data = await examHall_service_1.ExamHallService.listHalls(schoolId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * POST /api/v1/exam-halls
     */
    async createHall(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const hall = await examHall_service_1.ExamHallService.createHall({
                ...req.body,
                school_id: schoolId
            });
            res.status(201).json(hall);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * PUT /api/v1/exam-halls/:id
     */
    async updateHall(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context.user.school_id;
            const hall = await examHall_service_1.ExamHallService.updateHall(id, schoolId, req.body);
            res.json(hall);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * DELETE /api/v1/exam-halls/:id
     */
    async deleteHall(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context.user.school_id;
            const result = await examHall_service_1.ExamHallService.deleteHall(id, schoolId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * PATCH /api/v1/exam-halls/:id/toggle
     */
    async toggleActive(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context.user.school_id;
            const hall = await examHall_service_1.ExamHallService.toggleActive(id, schoolId);
            res.json(hall);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
