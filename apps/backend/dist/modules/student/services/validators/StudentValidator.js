"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentValidator = void 0;
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class StudentValidator {
    constructor(studentRepo) {
        this.studentRepo = studentRepo;
    }
    async validate(studentId) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new NotFoundError_1.NotFoundError(`Student with ID ${studentId} not found`);
        }
        if (student.deletedAt) {
            throw new BusinessRuleError_1.BusinessRuleError('Student record is soft-deleted');
        }
    }
}
exports.StudentValidator = StudentValidator;
