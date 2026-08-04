"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultValidator = void 0;
const ResultDTO_1 = require("../dto/ResultDTO");
const ValidationError_1 = require("../../../admission/errors/ValidationError");
class ResultValidator {
    static validateCreateSession(payload) {
        const res = ResultDTO_1.createSessionSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Create Session payload check failed', res.error.format());
        return res.data;
    }
    static validateCalculate(payload) {
        const res = ResultDTO_1.calculateResultsSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Calculate results payload check failed', res.error.format());
        return res.data;
    }
    static validateWorkflow(payload) {
        const res = ResultDTO_1.transitionWorkflowSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Workflow status checks failed', res.error.format());
        return res.data;
    }
    static validatePublish(payload) {
        const res = ResultDTO_1.publishResultsSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Publish result targets failed', res.error.format());
        return res.data;
    }
    static validatePromotion(payload) {
        const res = ResultDTO_1.promotionDecisionSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Promotion decision parameters failed', res.error.format());
        return res.data;
    }
    static validateSign(payload) {
        const res = ResultDTO_1.signResultsSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Digital signature parameters failed', res.error.format());
        return res.data;
    }
}
exports.ResultValidator = ResultValidator;
exports.default = ResultValidator;
