"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityValidator = void 0;
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class IdentityValidator {
    constructor(studentRepo) {
        this.studentRepo = studentRepo;
    }
    async validate(studentId) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        if (student.status !== 'ACTIVE' && student.status !== 'PROMOTED') {
            throw new BusinessRuleError_1.BusinessRuleError(`ID cards can only be generated for ACTIVE or PROMOTED students.`);
        }
    }
}
exports.IdentityValidator = IdentityValidator;
