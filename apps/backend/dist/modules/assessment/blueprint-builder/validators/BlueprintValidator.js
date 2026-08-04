"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintValidator = void 0;
const BlueprintDTO_1 = require("../dto/BlueprintDTO");
const ValidationError_1 = require("../../../../modules/admission/errors/ValidationError");
class BlueprintValidator {
    static validateCreate(payload) {
        const res = BlueprintDTO_1.blueprintCreateDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Blueprint creation schema validation failed', res.error.format());
        }
        return res.data;
    }
    static validateUpdate(payload) {
        const res = BlueprintDTO_1.blueprintUpdateDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Blueprint update schema validation failed', res.error.format());
        }
        return res.data;
    }
    static validateSearch(payload) {
        const res = BlueprintDTO_1.blueprintSearchDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Blueprint search validation failed', res.error.format());
        }
        return res.data;
    }
    static validateWorkflow(payload) {
        const res = BlueprintDTO_1.blueprintWorkflowDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Blueprint workflow transition validation failed', res.error.format());
        }
        return res.data;
    }
    static validateClone(payload) {
        const res = BlueprintDTO_1.blueprintCloneDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Blueprint clone validation failed', res.error.format());
        }
        return res.data;
    }
}
exports.BlueprintValidator = BlueprintValidator;
exports.default = BlueprintValidator;
