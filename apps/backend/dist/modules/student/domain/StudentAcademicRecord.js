"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAcademicRecord = void 0;
class StudentAcademicRecord {
    constructor(id, studentId, academicYearId, grade, gpaOrMarks, remarks, createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.academicYearId = academicYearId;
        this.grade = grade;
        this.gpaOrMarks = gpaOrMarks;
        this.remarks = remarks;
        this.createdAt = createdAt;
    }
}
exports.StudentAcademicRecord = StudentAcademicRecord;
