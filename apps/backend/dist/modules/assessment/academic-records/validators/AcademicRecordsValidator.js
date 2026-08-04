"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRecordsValidator = void 0;
const AcademicRecordsDTO_1 = require("../dto/AcademicRecordsDTO");
const ValidationError_1 = require("../../../admission/errors/ValidationError");
class AcademicRecordsValidator {
    static validateAcademicRecord(payload) {
        const res = AcademicRecordsDTO_1.createAcademicRecordSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Academic record payload check failed', res.error.format());
        return res.data;
    }
    static validateTranscriptRequest(payload) {
        const res = AcademicRecordsDTO_1.createTranscriptRequestSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Transcript request payload check failed', res.error.format());
        return res.data;
    }
    static validateStandingRule(payload) {
        const res = AcademicRecordsDTO_1.createStandingRuleSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Standing rule payload check failed', res.error.format());
        return res.data;
    }
    static validateGraduationApproval(payload) {
        const res = AcademicRecordsDTO_1.approveGraduationSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Graduation approval payload check failed', res.error.format());
        return res.data;
    }
}
exports.AcademicRecordsValidator = AcademicRecordsValidator;
exports.default = AcademicRecordsValidator;
