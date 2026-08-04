"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayValidator = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class HolidayValidator {
    constructor(holidayRepo) {
        this.holidayRepo = holidayRepo;
    }
    async validateWorkingDay(schoolId, date) {
        const holiday = await this.holidayRepo.findHolidayByDate(schoolId, date);
        if (holiday) {
            throw new BusinessRuleError_1.BusinessRuleError(`Cannot mark attendance on a holiday: ${holiday.name}`);
        }
    }
}
exports.HolidayValidator = HolidayValidator;
