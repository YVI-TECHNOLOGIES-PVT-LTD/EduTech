"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionValidator = void 0;
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class PromotionValidator {
    constructor(studentRepo) {
        this.studentRepo = studentRepo;
    }
    async validate(studentId) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        if (student.status !== 'ACTIVE' && student.status !== 'PROMOTED') {
            throw new BusinessRuleError_1.BusinessRuleError(`Only ACTIVE or PROMOTED students are eligible for promotion. Current: ${student.status}`);
        }
    }
}
exports.PromotionValidator = PromotionValidator;
