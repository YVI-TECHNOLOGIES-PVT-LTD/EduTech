"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamHallTicketController = void 0;
const examHallTicket_service_1 = require("../services/examHallTicket.service");
exports.ExamHallTicketController = {
    async generateTickets(req, res) {
        try {
            const { examId } = req.body;
            const userId = req.context.user.id;
            const schoolId = req.context.user.school_id;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const result = await examHallTicket_service_1.ExamHallTicketService.generateHallTickets(examId, userId, schoolId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getHallTickets(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const data = await examHallTicket_service_1.ExamHallTicketService.getHallTickets(examId);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async getMyHallTicket(req, res) {
        try {
            const { examId } = req.query;
            const studentId = req.query.studentId; // Or from context if student logged in
            if (!examId || !studentId)
                return res.status(400).json({ error: "Exam ID and Student ID required" });
            const data = await examHallTicket_service_1.ExamHallTicketService.getStudentHallTicket(studentId, examId);
            if (!data)
                return res.status(404).json({ error: "Hall ticket not found" });
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async publishTickets(req, res) {
        try {
            const { examId } = req.body;
            const userId = req.context.user.id;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const result = await examHallTicket_service_1.ExamHallTicketService.publishHallTickets(examId, userId);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async generateStudentPDF(req, res) {
        try {
            const { examId, studentId } = req.params;
            const schoolId = req.context.user.school_id;
            console.log(`[ExamHallTicketController] Generating PDF for Student: ${studentId}, Exam: ${examId}`);
            if (!examId || !studentId)
                return res.status(400).json({ error: "Exam ID and Student ID required" });
            const pdfBuffer = await examHallTicket_service_1.ExamHallTicketService.generateHallTicketPDF(examId, studentId, schoolId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="HallTicket_${studentId}.pdf"`);
            res.send(pdfBuffer);
        }
        catch (err) {
            console.error(`[ExamHallTicketController] PDF Generation Failed:`, {
                message: err.message,
                stack: err.stack,
                params: req.params
            });
            const status = err.message?.includes('NOT_FOUND') ? 404 :
                err.message?.includes('PUBLISHED') ? 403 : 500;
            res.status(status).json({ error: err.message || 'Internal server error' });
        }
    },
    async bulkReissueZip(req, res) {
        try {
            const { examId } = req.params;
            const schoolId = req.context.user.school_id;
            console.log(`[ExamHallTicketController] Generating Bulk ZIP for Exam: ${examId}`);
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            const zipBuffer = await examHallTicket_service_1.ExamHallTicketService.generateBulkHallTicketsZip(examId, schoolId);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="HallTickets_Exam_${examId}.zip"`);
            res.send(zipBuffer);
        }
        catch (err) {
            console.error(`[ExamHallTicketController] Bulk ZIP Generation Failed:`, {
                message: err.message,
                stack: err.stack,
                params: req.params
            });
            res.status(500).json({ error: err.message || 'Internal server error' });
        }
    }
};
