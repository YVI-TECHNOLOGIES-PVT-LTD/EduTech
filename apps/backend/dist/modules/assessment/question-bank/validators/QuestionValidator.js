"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionValidator = void 0;
const QuestionDTO_1 = require("../dto/QuestionDTO");
const ValidationError_1 = require("../../../../modules/admission/errors/ValidationError");
class QuestionValidator {
    static validateCreate(payload) {
        const res = QuestionDTO_1.questionCreateDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Question create validation failed', res.error.format());
        }
        return res.data;
    }
    static validateUpdate(payload) {
        const res = QuestionDTO_1.questionUpdateDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Question update validation failed', res.error.format());
        }
        return res.data;
    }
    static validateSearch(payload) {
        const res = QuestionDTO_1.questionSearchDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Question search parameters validation failed', res.error.format());
        }
        return res.data;
    }
    static validateFolder(payload) {
        const res = QuestionDTO_1.questionFolderDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Folder validation failed', res.error.format());
        }
        return res.data;
    }
    static validateAsset(payload) {
        const res = QuestionDTO_1.questionAssetDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Asset registration validation failed', res.error.format());
        }
        return res.data;
    }
    static validateWorkflow(payload) {
        const res = QuestionDTO_1.questionWorkflowDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Workflow payload validation failed', res.error.format());
        }
        return res.data;
    }
    static validateImport(payload) {
        const res = QuestionDTO_1.questionImportDTOSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Question import parameters validation failed', res.error.format());
        }
        return res.data;
    }
    static validateBulkMove(payload) {
        const res = QuestionDTO_1.questionBulkMoveSchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Bulk move validation failed', res.error.format());
        }
        return res.data;
    }
    static validateBulkCopy(payload) {
        const res = QuestionDTO_1.questionBulkCopySchema.safeParse(payload);
        if (!res.success) {
            throw new ValidationError_1.ValidationError('Bulk copy validation failed', res.error.format());
        }
        return res.data;
    }
}
exports.QuestionValidator = QuestionValidator;
exports.default = QuestionValidator;
