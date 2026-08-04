"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferValidator = void 0;
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class TransferValidator {
    constructor(studentRepo) {
        this.studentRepo = studentRepo;
    }
    async validate(studentId) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        if (student.status !== 'ACTIVE') {
            throw new BusinessRuleError_1.BusinessRuleError(`Only ACTIVE students can initiate transfers. Current: ${student.status}`);
        }
    }
}
exports.TransferValidator = TransferValidator;
