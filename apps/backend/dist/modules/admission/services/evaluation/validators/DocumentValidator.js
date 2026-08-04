"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class DocumentValidator {
    constructor(docRepo, checklistRepo, appRepo) {
        this.docRepo = docRepo;
        this.checklistRepo = checklistRepo;
        this.appRepo = appRepo;
    }
    async validate(applicationId) {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new Error(`Application with ID ${applicationId} not found`);
        }
        // Get checklists required for this application's school + year + grade
        const grade = await this.appRepo.getGradeForApplication(applicationId);
        const checklist = await this.checklistRepo.findByGrade(app.schoolId, app.academicYearId, grade);
        // Fetch documents uploaded for this application
        const docs = await this.docRepo.findByApplicationId(applicationId);
        // For each mandatory checklist item, verify that it exists and is VERIFIED
        const mandatoryRules = checklist.filter(c => c.mandatory);
        for (const rule of mandatoryRules) {
            const uploaded = docs.find(d => d.documentTypeId === rule.documentTypeId);
            if (!uploaded) {
                throw new BusinessRuleError_1.BusinessRuleError(`Mandatory document with Type ID "${rule.documentTypeId}" is missing.`);
            }
            if (uploaded.status !== 'VERIFIED') {
                throw new BusinessRuleError_1.BusinessRuleError(`Mandatory document with Type ID "${rule.documentTypeId}" has status "${uploaded.status}". Must be VERIFIED.`);
            }
        }
    }
}
exports.DocumentValidator = DocumentValidator;
