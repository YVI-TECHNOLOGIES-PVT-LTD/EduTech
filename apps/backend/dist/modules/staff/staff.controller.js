"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const staff_service_1 = require("./staff.service");
exports.StaffController = {
    async getAllProfiles(req, res) {
        try {
            const schoolId = req.context.user.school_id;
            const { page, limit, search } = req.query;
            const result = await staff_service_1.StaffService.getAllProfiles(schoolId, Number(page) || 1, Number(limit) || 10, search);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async createProfile(req, res) {
        try {
            const { user_id, department_id, staff_type, joining_date } = req.body;
            if (!user_id || !staff_type)
                return res.status(400).json({ error: "User ID and Staff Type required" });
            const profile = await staff_service_1.StaffService.createProfile({
                user_id, department_id, staff_type, joining_date
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
            delete updates.id;
            delete updates.user_id;
            const profile = await staff_service_1.StaffService.updateProfile(id, updates);
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
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            const profile = await staff_service_1.StaffService.updateStatus(id, status);
            res.json(profile);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
