"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateValidator = void 0;
const template_dto_1 = require("../dto/template.dto");
const ValidationError_1 = require("../../../../modules/admission/errors/ValidationError");
class TemplateValidator {
    static validateCreate(payload) {
        const res = template_dto_1.createTemplateSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Template schema validation failed', res.error.format());
        }
        return res.data;
    }
    static validateUpdate(payload) {
        const res = template_dto_1.updateTemplateSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Template update schema validation failed', res.error.format());
        }
        return res.data;
    }
    static validateWorkflow(payload) {
        const res = template_dto_1.templateWorkflowSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Template status transition validation failed', res.error.format());
        }
        return res.data;
    }
    static validateClone(payload) {
        const res = template_dto_1.templateCloneSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Template clone parameters validation failed', res.error.format());
        }
        return res.data;
    }
}
exports.TemplateValidator = TemplateValidator;
exports.default = TemplateValidator;
