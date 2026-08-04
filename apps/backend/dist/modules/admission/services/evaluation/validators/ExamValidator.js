"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class ExamValidator {
    constructor(appVal, docVal, interviewRepo) {
        this.appVal = appVal;
        this.docVal = docVal;
        this.interviewRepo = interviewRepo;
    }
    async validate(applicationId) {
        await this.appVal.validate(applicationId);
        await this.docVal.validate(applicationId);
        const interview = await this.interviewRepo.findByApplicationId(applicationId);
        if (!interview) {
            throw new BusinessRuleError_1.BusinessRuleError('Interview must be scheduled and completed before entrance exam allocation.');
        }
        if (interview.status !== 'EVALUATED') {
            throw new BusinessRuleError_1.BusinessRuleError('Interview evaluation must be completed before entrance exam allocation.');
        }
    }
}
exports.ExamValidator = ExamValidator;
