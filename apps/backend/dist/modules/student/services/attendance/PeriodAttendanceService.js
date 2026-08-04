"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodAttendanceService = void 0;
const AttendancePeriod_1 = require("../../domain/attendance/AttendancePeriod");
class PeriodAttendanceService {
    constructor(attendanceRepo, studentRepo) {
        this.attendanceRepo = attendanceRepo;
        this.studentRepo = studentRepo;
    }
    async markPeriod(studentId, academicYearId, date, periodNumber, subjectId, status, markedBy) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }
        const period = new AttendancePeriod_1.AttendancePeriod(crypto.randomUUID(), studentId, academicYearId, date, periodNumber, subjectId, status, markedBy, new Date());
        await this.attendanceRepo.savePeriod(period);
        return period;
    }
}
exports.PeriodAttendanceService = PeriodAttendanceService;
