"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsValidator = void 0;
const AnalyticsDTO_1 = require("../dto/AnalyticsDTO");
const ValidationError_1 = require("../../../admission/errors/ValidationError");
class AnalyticsValidator {
    static validateSnapshot(payload) {
        const res = AnalyticsDTO_1.createSnapshotSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Snapshot payload check failed', res.error.format());
        return res.data;
    }
    static validateAccreditation(payload) {
        const res = AnalyticsDTO_1.generateAccreditationSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Accreditation payload check failed', res.error.format());
        return res.data;
    }
    static validateRiskScore(payload) {
        const res = AnalyticsDTO_1.saveRiskScoreSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Risk score payload check failed', res.error.format());
        return res.data;
    }
    static validateLearningGap(payload) {
        const res = AnalyticsDTO_1.saveLearningGapSchema.safeParse(payload);
        if (!res.success)
            throw new ValidationError_1.ValidationError('Learning gap payload check failed', res.error.format());
        return res.data;
    }
}
exports.AnalyticsValidator = AnalyticsValidator;
exports.default = AnalyticsValidator;
