"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionCapacityValidator = void 0;
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class SectionCapacityValidator {
    constructor(allocRepo) {
        this.allocRepo = allocRepo;
    }
    /**
     * Checks section headcount against configured class capacity limit.
     */
    async validate(academicYearId, grade, sectionId, maxCapacity = 30) {
        const count = await this.allocRepo.countSectionStudents(academicYearId, grade, sectionId);
        if (count >= maxCapacity) {
            throw new BusinessRuleError_1.BusinessRuleError(`Class allocation failed. Section has reached maximum student capacity limit of ${maxCapacity}.`);
        }
    }
}
exports.SectionCapacityValidator = SectionCapacityValidator;
