"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCaptureController = void 0;
const AttendanceCaptureService_1 = require("../services/AttendanceCaptureService");
const AttendanceValidationService_1 = require("../services/AttendanceValidationService");
const AttendanceValidator_1 = require("../validators/AttendanceValidator");
class AttendanceCaptureController {
    static async markStudent(req, res) {
        try {
            const userId = req.context?.user?.id;
            if (!userId)
                return res.status(400).json({ error: 'Context details missing.' });
            const validated = AttendanceValidator_1.AttendanceValidator.validateMarkAttendance(req.body);
            // Validate leave overlaps before capturing checkins
            await AttendanceCaptureController.validationService.validateMarking(validated.student_id, new Date().toISOString().split('T')[0]);
            const record = await AttendanceCaptureController.captureService.captureStudentMark(validated, userId);
            return res.status(201).json(record);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to capture attendance.' });
        }
    }
}
exports.AttendanceCaptureController = AttendanceCaptureController;
AttendanceCaptureController.captureService = new AttendanceCaptureService_1.AttendanceCaptureService();
AttendanceCaptureController.validationService = new AttendanceValidationService_1.AttendanceValidationService();
exports.default = AttendanceCaptureController;
