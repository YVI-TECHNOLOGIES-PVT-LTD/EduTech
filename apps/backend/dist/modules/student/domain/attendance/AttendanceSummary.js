"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSummary = void 0;
class AttendanceSummary {
    constructor(id, studentId, academicYearId, month, totalPresent, totalAbsent, totalLate, attendancePercentage, lastCalculated) {
        this.id = id;
        this.studentId = studentId;
        this.academicYearId = academicYearId;
        this.month = month;
        this.totalPresent = totalPresent;
        this.totalAbsent = totalAbsent;
        this.totalLate = totalLate;
        this.attendancePercentage = attendancePercentage;
        this.lastCalculated = lastCalculated;
    }
}
exports.AttendanceSummary = AttendanceSummary;
