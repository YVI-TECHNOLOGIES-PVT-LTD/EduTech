"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkingDay = void 0;
class WorkingDay {
    constructor(id, schoolId, academicYearId, grade, month, totalWorkingDays, createdAt) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.grade = grade;
        this.month = month;
        this.totalWorkingDays = totalWorkingDays;
        this.createdAt = createdAt;
    }
}
exports.WorkingDay = WorkingDay;
