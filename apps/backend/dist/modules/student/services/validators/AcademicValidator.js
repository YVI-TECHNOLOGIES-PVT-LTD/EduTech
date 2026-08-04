"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicValidator = void 0;
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class AcademicValidator {
    constructor(academicRepo) {
        this.academicRepo = academicRepo;
    }
    async validate(studentId) {
        const records = await this.academicRepo.findRecords(studentId);
        if (!records || records.length === 0) {
            throw new BusinessRuleError_1.BusinessRuleError('No active academic history found for student');
        }
    }
}
exports.AcademicValidator = AcademicValidator;
