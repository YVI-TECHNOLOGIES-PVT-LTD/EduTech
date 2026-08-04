"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacultyController = void 0;
const faculty_service_1 = require("./faculty.service");
exports.FacultyController = {
    async getAllProfiles(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const { page, limit, search } = req.query;
            const result = await faculty_service_1.FacultyService.getAllProfiles(schoolId, Number(page) || 1, Number(limit) || 10, search);
            res.json(result);
        }
        catch (error) {
            console.error(`[FacultyController] Error:`, error);
            res.status(500).json({ error: error.message });
        }
    },
    async createProfile(req, res) {
        try {
            const { user_id, employee_code, department_id, designation, qualification, joining_date } = req.body;
            if (!user_id)
                return res.status(400).json({ error: "User ID is required" });
            const profile = await faculty_service_1.FacultyService.createProfile({
                user_id, employee_code, department_id, designation, qualification, joining_date
            });
            res.status(201).json(profile);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async updateProfile(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            delete updates.id; // Prevent ID update
            delete updates.user_id; // Prevent User ID update
            const profile = await faculty_service_1.FacultyService.updateProfile(id, updates);
            res.json(profile);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['active', 'inactive', 'on_leave'].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            const profile = await faculty_service_1.FacultyService.updateStatus(id, status);
            res.json(profile);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async assignSubject(req, res) {
        try {
            const { sectionId, subjectId } = req.params;
            const { faculty_profile_id } = req.body;
            const assignedBy = req.context.user.id;
            if (!faculty_profile_id)
                return res.status(400).json({ error: "Faculty Profile ID required" });
            const assignment = await faculty_service_1.FacultyService.assignSubjectToSection({
                section_id: sectionId,
                subject_id: subjectId,
                faculty_profile_id,
                assigned_by: assignedBy
            });
            res.status(201).json(assignment);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async getSectionAssignments(req, res) {
        try {
            const { sectionId } = req.params;
            const assignments = await faculty_service_1.FacultyService.getSectionAssignments(sectionId);
            res.json(assignments);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getMySubjects(req, res) {
        try {
            const userId = req.context.user.id;
            const subjects = await faculty_service_1.FacultyService.getMySubjects(userId);
            res.json(subjects);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async updateMySubjectAssignment(req, res) {
        try {
            const userId = req.context.user.id;
            const { assignmentId } = req.params;
            const updates = req.body;
            // Prevent changing core IDs
            delete updates.id;
            delete updates.faculty_profile_id;
            delete updates.section_id;
            delete updates.subject_id;
            const result = await faculty_service_1.FacultyService.updateAssignment(assignmentId, updates, userId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
