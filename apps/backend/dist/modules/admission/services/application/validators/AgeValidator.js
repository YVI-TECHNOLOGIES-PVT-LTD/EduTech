"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgeValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class AgeValidator {
    constructor(appRepo) {
        this.appRepo = appRepo;
    }
    async validate(dateOfBirth, grade) {
        const rule = await this.appRepo.getAgeRule(grade);
        if (!rule) {
            // No strict rule for this grade, skip
            return;
        }
        // Precise age calculation
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        if (age < rule.min_age || age > rule.max_age) {
            throw new BusinessRuleError_1.BusinessRuleError(`Student age (${age} years) is ineligible for grade ${grade}. Required range: [${rule.min_age} - ${rule.max_age}] years.`);
        }
    }
}
exports.AgeValidator = AgeValidator;
