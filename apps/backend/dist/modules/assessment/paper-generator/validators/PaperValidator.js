"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperValidator = void 0;
const PaperDTO_1 = require("../dto/PaperDTO");
const ValidationError_1 = require("../../../admission/errors/ValidationError");
class PaperValidator {
    static validateCreate(payload) {
        const res = PaperDTO_1.createPaperSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Paper creation schema check failed', res.error.format());
        }
        return res.data;
    }
    static validateUpdate(payload) {
        const res = PaperDTO_1.updatePaperSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Paper update schema check failed', res.error.format());
        }
        return res.data;
    }
    static validateWorkflow(payload) {
        const res = PaperDTO_1.paperWorkflowSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Paper status workflow transition validation failed', res.error.format());
        }
        return res.data;
    }
    static validateGenerationJob(payload) {
        const res = PaperDTO_1.createGenerationJobSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Generation job payload check failed', res.error.format());
        }
        return res.data;
    }
    static validateExport(payload) {
        const res = PaperDTO_1.exportPaperSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Export parameters check failed', res.error.format());
        }
        return res.data;
    }
}
exports.PaperValidator = PaperValidator;
exports.default = PaperValidator;
