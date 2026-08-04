"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceValidator = void 0;
const AttendanceDTO_1 = require("../dto/AttendanceDTO");
const ValidationError_1 = require("../../admission/errors/ValidationError");
class AttendanceValidator {
    static validateCreateSession(payload) {
        const res = AttendanceDTO_1.createSessionSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Create session payload check failed', res.error.format());
        return res.data;
    }
    static validateMarkAttendance(payload) {
        const res = AttendanceDTO_1.markAttendanceSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Mark attendance payload check failed', res.error.format());
        return res.data;
    }
    static validateTransitionWorkflow(payload) {
        const res = AttendanceDTO_1.transitionWorkflowSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Workflow payload check failed', res.error.format());
        return res.data;
    }
    static validateSubmitLeave(payload) {
        const res = AttendanceDTO_1.submitLeaveSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Leave payload check failed', res.error.format());
        return res.data;
    }
}
exports.AttendanceValidator = AttendanceValidator;
exports.default = AttendanceValidator;
