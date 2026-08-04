"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationValidator = void 0;
const NotFoundError_1 = require("../../../errors/NotFoundError");
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class ApplicationValidator {
    constructor(appRepo) {
        this.appRepo = appRepo;
    }
    async validate(applicationId) {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${applicationId} not found`);
        }
        if (app.deletedAt) {
            throw new BusinessRuleError_1.BusinessRuleError(`Application with ID ${applicationId} is soft-deleted`);
        }
        const evaluationEligible = new Set([
            'SUBMITTED',
            'UNDER_REVIEW',
            'DOCS_PENDING',
            'DOCUMENT_VERIFIED',
            'INTERVIEW',
            'EXAM',
            'MERIT',
            'FEE_PENDING',
            'FEE_VERIFIED',
            'OFFERED',
        ]);
        if (!evaluationEligible.has(app.status)) {
            throw new BusinessRuleError_1.BusinessRuleError(`Application is not eligible for the evaluation pipeline. Current status: ${app.status}`);
        }
    }
}
exports.ApplicationValidator = ApplicationValidator;
