"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamAdminBridgeController = void 0;
const examAdminBridge_service_1 = require("../services/examAdminBridge.service");
exports.ExamAdminBridgeController = {
    /**
     * Set authoritative attendance for a student
     */
    async setAttendance(req, res) {
        try {
            const { studentId, academicYearId, percentage, term } = req.body;
            const userId = req.context?.user?.id;
            if (!studentId || !academicYearId || percentage === undefined || !userId) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            const result = await examAdminBridge_service_1.ExamAdminBridgeService.setAttendance({
                studentId,
                academicYearId,
                percentage,
                userId,
                term
            });
            res.json(result);
        }
        catch (err) {
            console.error("Set Attendance Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Set authoritative fee status for a student
     */
    async setFeeStatus(req, res) {
        try {
            const { studentId, academicYearId, status, term, remarks } = req.body;
            const userId = req.context?.user?.id;
            if (!studentId || !academicYearId || !status || !userId) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            const result = await examAdminBridge_service_1.ExamAdminBridgeService.setFeeStatus({
                studentId,
                academicYearId,
                status,
                userId,
                term,
                remarks
            });
            res.json(result);
        }
        catch (err) {
            console.error("Set Fee Status Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Get bridge data (students + cache) for a class
     */
    async getClassBridgeData(req, res) {
        try {
            const { classId } = req.params;
            const { academicYearId } = req.query;
            if (!classId || !academicYearId) {
                return res.status(400).json({ error: "Class ID and Academic Year ID required" });
            }
            const data = await examAdminBridge_service_1.ExamAdminBridgeService.getClassBridgeData(classId, academicYearId);
            res.json(data);
        }
        catch (err) {
            console.error("Get Class Bridge Data Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
};
