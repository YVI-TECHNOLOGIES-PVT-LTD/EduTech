"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayService = void 0;
const Holiday_1 = require("../../domain/attendance/Holiday");
class HolidayService {
    constructor(holidayRepo) {
        this.holidayRepo = holidayRepo;
    }
    async createHoliday(schoolId, holidayDate, name, description) {
        const holiday = new Holiday_1.Holiday(crypto.randomUUID(), schoolId, holidayDate, name, description, new Date());
        await this.holidayRepo.saveHoliday(holiday);
        return holiday;
    }
}
exports.HolidayService = HolidayService;
