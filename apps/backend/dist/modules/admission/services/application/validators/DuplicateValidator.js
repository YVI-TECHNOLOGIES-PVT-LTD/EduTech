"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateValidator = void 0;
const ConflictError_1 = require("../../../errors/ConflictError");
class DuplicateValidator {
    constructor(appRepo) {
        this.appRepo = appRepo;
    }
    async validate(leadId, studentName, dateOfBirth, academicYearId, excludeApplicationId) {
        // 1. Check if this lead already has an application
        const existingByLead = await this.appRepo.findCurrentByLeadId(leadId);
        if (existingByLead && existingByLead.id !== excludeApplicationId) {
            throw new ConflictError_1.ConflictError('This student already has an active admission application for the selected academic year.');
        }
        // 2. Check if another student with the same name and DOB has a registered application for this academic year
        const existingByName = await this.appRepo.findCurrentByDetails(studentName, dateOfBirth, academicYearId);
        if (existingByName && existingByName.id !== excludeApplicationId) {
            throw new ConflictError_1.ConflictError('This student already has an active admission application for the selected academic year.');
        }
    }
}
exports.DuplicateValidator = DuplicateValidator;
