"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancePeriod = void 0;
class AttendancePeriod {
    constructor(id, studentId, academicYearId, date, periodNumber, subjectId, status, markedBy, markedAt) {
        this.id = id;
        this.studentId = studentId;
        this.academicYearId = academicYearId;
        this.date = date;
        this.periodNumber = periodNumber;
        this.subjectId = subjectId;
        this.status = status;
        this.markedBy = markedBy;
        this.markedAt = markedAt;
    }
}
exports.AttendancePeriod = AttendancePeriod;
