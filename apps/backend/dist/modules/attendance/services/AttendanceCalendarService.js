"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCalendarService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const AttendanceCalendarRepository_1 = require("../repositories/AttendanceCalendarRepository");
class AttendanceCalendarService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AttendanceCalendarRepository_1.AttendanceCalendarRepository();
    }
    async registerCalendarDay(calendarId, dayDate, dayType, remarks, correlationId) {
        this.logInfo(`Setting attendance calendar day settings for ${dayDate}: type=${dayType}`, correlationId);
        return this.repo.setCalendarDay(calendarId, {
            day_date: dayDate,
            day_type: dayType,
            remarks
        });
    }
}
exports.AttendanceCalendarService = AttendanceCalendarService;
exports.default = AttendanceCalendarService;
