"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentChecklist = void 0;
class DocumentChecklist {
    constructor(id, schoolId, academicYearId, grade, admissionType, documentTypeId, mandatory, minimumCopies) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.grade = grade;
        this.admissionType = admissionType;
        this.documentTypeId = documentTypeId;
        this.mandatory = mandatory;
        this.minimumCopies = minimumCopies;
    }
}
exports.DocumentChecklist = DocumentChecklist;
