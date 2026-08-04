"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationValidator = void 0;
const EvaluationDTO_1 = require("../dto/EvaluationDTO");
const ValidationError_1 = require("../../../admission/errors/ValidationError");
class EvaluationValidator {
    static validateStart(payload) {
        const res = EvaluationDTO_1.startEvaluationSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Start session check failed', res.error.format());
        return res.data;
    }
    static validateQuestionScore(payload) {
        const res = EvaluationDTO_1.evaluateQuestionSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Question evaluation input check failed', res.error.format());
        return res.data;
    }
    static validateModeration(payload) {
        const res = EvaluationDTO_1.moderateSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Moderation resolution check failed', res.error.format());
        return res.data;
    }
    static validateRevaluation(payload) {
        const res = EvaluationDTO_1.revaluationSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Revaluation check failed', res.error.format());
        return res.data;
    }
    static validateRubric(payload) {
        const res = EvaluationDTO_1.createRubricSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Rubric schema check failed', res.error.format());
        return res.data;
    }
    static validateGradeCalculation(payload) {
        const res = EvaluationDTO_1.gradeCalculateSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Grade calculation schema check failed', res.error.format());
        return res.data;
    }
}
exports.EvaluationValidator = EvaluationValidator;
exports.default = EvaluationValidator;
