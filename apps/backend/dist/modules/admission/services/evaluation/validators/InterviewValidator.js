"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
const INTERVIEW_ELIGIBLE_STATUSES = new Set([
    'DOCUMENT_VERIFIED',
    'INTERVIEW',
    'UNDER_REVIEW',
    'SUBMITTED',
]);
class InterviewValidator {
    constructor(appRepo, interviewRepo) {
        this.appRepo = appRepo;
        this.interviewRepo = interviewRepo;
    }
    async validate(applicationId) {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new BusinessRuleError_1.BusinessRuleError(`Application ${applicationId} not found.`);
        }
        if (!INTERVIEW_ELIGIBLE_STATUSES.has(application.status)) {
            throw new BusinessRuleError_1.BusinessRuleError(`Application must have verified documents before scheduling interview. Current status: ${application.status}.`);
        }
        const existing = await this.interviewRepo.findByApplicationId(applicationId);
        if (existing) {
            throw new BusinessRuleError_1.BusinessRuleError(`An interview is already scheduled for this application.`);
        }
    }
}
exports.InterviewValidator = InterviewValidator;
