"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentConfigurationValidator = void 0;
const AssessmentConfigurationDTO_1 = require("../dto/AssessmentConfigurationDTO");
const ValidationError_1 = require("../../../../modules/admission/errors/ValidationError");
class AssessmentConfigurationValidator {
    static validate(payload) {
        const result = AssessmentConfigurationDTO_1.assessmentConfigurationSchema.safeParse(payload);
        if (!result.success) {
            throw new ValidationError_1.ValidationError('Assessment configuration validation failed', result.error.format());
        }
        return result.data;
    }
    static validatePartial(payload) {
        const result = AssessmentConfigurationDTO_1.assessmentConfigurationSchema.partial().safeParse(payload);
        if (!result.success) {
            throw new ValidationError_1.ValidationError('Assessment configuration partial validation failed', result.error.format());
        }
        return result.data;
    }
}
exports.AssessmentConfigurationValidator = AssessmentConfigurationValidator;
