"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSession = void 0;
class AttendanceSession {
    constructor(id, schoolId, academicYearId, grade, sectionId, date, status, createdBy, createdAt) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.grade = grade;
        this.sectionId = sectionId;
        this.date = date;
        this.status = status;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
    closeSession() {
        this.status = 'CLOSED';
    }
}
exports.AttendanceSession = AttendanceSession;
