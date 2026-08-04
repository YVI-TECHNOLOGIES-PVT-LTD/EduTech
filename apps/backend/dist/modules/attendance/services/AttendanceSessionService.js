"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const AttendanceSessionRepository_1 = require("../repositories/AttendanceSessionRepository");
class AttendanceSessionService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AttendanceSessionRepository_1.AttendanceSessionRepository();
    }
    async createDailySession(schoolId, payload, correlationId) {
        this.logInfo(`Creating attendance session for date: ${payload.session_date}`, correlationId);
        return this.repo.createSession(schoolId, {
            campus_id: payload.campus_id,
            branch_id: payload.branch_id,
            academic_year_id: payload.academic_year_id,
            session_date: payload.session_date,
            timetable_slot_id: payload.timetable_slot_id
        });
    }
}
exports.AttendanceSessionService = AttendanceSessionService;
exports.default = AttendanceSessionService;
