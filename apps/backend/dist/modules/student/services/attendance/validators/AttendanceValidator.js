"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceValidator = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class AttendanceValidator {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async validateDuplicate(studentId, sessionId) {
        const existing = await this.attendanceRepo.findByStudentAndSession(studentId, sessionId);
        if (existing) {
            throw new BusinessRuleError_1.BusinessRuleError('Attendance has already been marked for this student in the session.');
        }
    }
}
exports.AttendanceValidator = AttendanceValidator;
