"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentController = void 0;
const assignment_service_1 = require("./assignment.service");
class AssignmentController {
    static async create(req, res) {
        try {
            const { school_id, id: userId } = req.context.user;
            const { academic_year_id, section_id, subject_id, title, description, due_date, max_marks, file_url } = req.body;
            const assignment = await assignment_service_1.AssignmentService.create({
                school_id,
                academic_year_id,
                section_id,
                subject_id,
                teacher_user_id: userId,
                title,
                description,
                due_date,
                max_marks,
                file_url
            });
            res.status(201).json(assignment);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getBySection(req, res) {
        try {
            const { sectionId } = req.params;
            const assignments = await assignment_service_1.AssignmentService.listBySection(sectionId);
            res.json(assignments);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getMyAssignments(req, res) {
        try {
            const { studentId } = req.params; // Admin/Teacher viewing specific student or parent viewing child
            const assignments = await assignment_service_1.AssignmentService.getMyAssignments(studentId);
            res.json(assignments);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getTeacherAssignments(req, res) {
        try {
            const userId = req.context.user.id;
            const assignments = await assignment_service_1.AssignmentService.listByTeacher(userId);
            res.json(assignments);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.AssignmentController = AssignmentController;
