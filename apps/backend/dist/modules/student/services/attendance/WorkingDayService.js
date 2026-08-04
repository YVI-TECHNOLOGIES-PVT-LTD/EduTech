"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkingDayService = void 0;
const WorkingDay_1 = require("../../domain/attendance/WorkingDay");
class WorkingDayService {
    constructor(holidayRepo) {
        this.holidayRepo = holidayRepo;
    }
    async configureWorkingDays(schoolId, academicYearId, grade, month, totalWorkingDays) {
        const wd = new WorkingDay_1.WorkingDay(crypto.randomUUID(), schoolId, academicYearId, grade, month, totalWorkingDays, new Date());
        await this.holidayRepo.saveWorkingDay(wd);
        return wd;
    }
}
exports.WorkingDayService = WorkingDayService;
