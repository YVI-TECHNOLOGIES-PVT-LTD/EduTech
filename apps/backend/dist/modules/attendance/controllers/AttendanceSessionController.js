"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionController = void 0;
const AttendanceSessionRepository_1 = require("../repositories/AttendanceSessionRepository");
const AttendanceSessionService_1 = require("../services/AttendanceSessionService");
const AttendanceValidator_1 = require("../validators/AttendanceValidator");
class AttendanceSessionController {
    static async listSessions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await AttendanceSessionController.repo.listSessions(schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list attendance sessions.' });
        }
    }
    static async createSession(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'Context details missing.' });
            const validated = AttendanceValidator_1.AttendanceValidator.validateCreateSession(req.body);
            const session = await AttendanceSessionController.service.createDailySession(schoolId, validated);
            return res.status(201).json(session);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to create attendance session.' });
        }
    }
}
exports.AttendanceSessionController = AttendanceSessionController;
AttendanceSessionController.repo = new AttendanceSessionRepository_1.AttendanceSessionRepository();
AttendanceSessionController.service = new AttendanceSessionService_1.AttendanceSessionService();
exports.default = AttendanceSessionController;
