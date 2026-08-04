"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSeatingController = void 0;
const supabase_1 = require("../../../config/supabase");
const examSeating_service_1 = require("../services/examSeating.service");
exports.ExamSeatingController = {
    // HALLS MANAGEMENT
    async getHalls(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const { data, error } = await supabase_1.supabase.from('exam_halls').select('*').eq('school_id', schoolId).order('hall_name');
            if (error)
                throw error;
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async createHall(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const { hall_name, capacity, location, rows_count, cols_count } = req.body;
            const { data, error } = await supabase_1.supabase
                .from('exam_halls')
                .insert({
                school_id: schoolId,
                hall_name,
                capacity,
                location,
                rows_count,
                cols_count
            })
                .select()
                .single();
            if (error)
                throw error;
            res.status(201).json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async deleteHall(req, res) {
        try {
            const { id } = req.params;
            const { error } = await supabase_1.supabase.from('exam_halls').delete().eq('id', id);
            if (error)
                throw error;
            res.json({ message: "Deleted" });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    // ALLOCATION
    async generateSeating(req, res) {
        try {
            const { examId, classId } = req.body;
            const userId = req.context.user.id;
            const schoolId = req.context.user.school_id;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const result = await examSeating_service_1.ExamSeatingService.generateSeating(examId, classId, userId, schoolId);
            res.json({ message: "Seating Generated Successfully", ...result });
        }
        catch (err) {
            console.error("Seating Gen Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    async getSeatingView(req, res) {
        try {
            const { examId, classId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examSeating_service_1.ExamSeatingService.getSeatingView(examId, classId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getEligibleStudents(req, res) {
        try {
            const { examId, classId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examSeating_service_1.ExamSeatingService.getEligibleStudents(examId, classId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async publishSeating(req, res) {
        try {
            const { examId } = req.body;
            const userId = req.context.user.id;
            const schoolId = req.context.user.school_id;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const result = await examSeating_service_1.ExamSeatingService.publishSeating(examId, userId, schoolId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async resetSeating(req, res) {
        try {
            const { examId } = req.body;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const result = await examSeating_service_1.ExamSeatingService.resetSeating(examId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
