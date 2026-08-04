"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class ConfirmationValidator {
    constructor(confirmRepo) {
        this.confirmRepo = confirmRepo;
    }
    async validate(applicationId) {
        const conf = await this.confirmRepo.findByApplicationId(applicationId);
        if (!conf) {
            throw new BusinessRuleError_1.BusinessRuleError('Admission details have not been confirmed for this candidate.');
        }
    }
}
exports.ConfirmationValidator = ConfirmationValidator;
