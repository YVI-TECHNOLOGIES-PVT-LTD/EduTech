"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSummaryService = void 0;
const AttendanceSummary_1 = require("../../domain/attendance/AttendanceSummary");
class AttendanceSummaryService {
    constructor(reportRepo, holidayRepo, studentRepo, calc) {
        this.reportRepo = reportRepo;
        this.holidayRepo = holidayRepo;
        this.studentRepo = studentRepo;
        this.calc = calc;
    }
    async calculateMonthlySummary(studentId, academicYearId, month) {
        const student = await this.studentRepo.findById(studentId);
        if (!student)
            throw new Error('Student not found');
        const present = await this.reportRepo.countAttendanceByStatus(studentId, academicYearId, month, 'PRESENT');
        const absent = await this.reportRepo.countAttendanceByStatus(studentId, academicYearId, month, 'ABSENT');
        const late = await this.reportRepo.countAttendanceByStatus(studentId, academicYearId, month, 'LATE');
        let totalWorking = 22;
        const config = await this.holidayRepo.findWorkingDay(student.schoolId, academicYearId, 'Grade 1', month);
        if (config) {
            totalWorking = config.totalWorkingDays;
        }
        const percentage = this.calc.calculatePercentage(present, totalWorking);
        let summary = await this.reportRepo.findSummary(studentId, academicYearId, month);
        if (!summary) {
            summary = new AttendanceSummary_1.AttendanceSummary(crypto.randomUUID(), studentId, academicYearId, month, present, absent, late, percentage, new Date());
        }
        else {
            summary = new AttendanceSummary_1.AttendanceSummary(summary.id, studentId, academicYearId, month, present, absent, late, percentage, new Date());
        }
        await this.reportRepo.saveSummary(summary);
        return summary;
    }
}
exports.AttendanceSummaryService = AttendanceSummaryService;
