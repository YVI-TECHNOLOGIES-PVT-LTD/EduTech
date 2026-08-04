"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentChecklistService = void 0;
class DocumentChecklistService {
    constructor(checklistRepo) {
        this.checklistRepo = checklistRepo;
    }
    /**
     * Lists the checklist rules mapped to a specific grade.
     */
    async getChecklist(schoolId, academicYearId, grade) {
        return this.checklistRepo.findByGrade(schoolId, academicYearId, grade);
    }
}
exports.DocumentChecklistService = DocumentChecklistService;
