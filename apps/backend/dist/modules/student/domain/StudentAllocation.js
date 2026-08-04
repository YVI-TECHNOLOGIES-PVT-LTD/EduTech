"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAllocation = void 0;
class StudentAllocation {
    constructor(id, studentId, academicYearId, grade, sectionId, rollNumber, allocatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.academicYearId = academicYearId;
        this.grade = grade;
        this.sectionId = sectionId;
        this.rollNumber = rollNumber;
        this.allocatedAt = allocatedAt;
    }
}
exports.StudentAllocation = StudentAllocation;
