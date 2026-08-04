"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionService = void 0;
const AttendanceSession_1 = require("../../domain/attendance/AttendanceSession");
class AttendanceSessionService {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async getOrCreateSession(schoolId, academicYearId, grade, sectionId, date, createdBy) {
        let session = await this.attendanceRepo.findSessionByDetails(schoolId, academicYearId, grade, sectionId, date);
        if (!session) {
            session = new AttendanceSession_1.AttendanceSession(crypto.randomUUID(), schoolId, academicYearId, grade, sectionId, date, 'OPEN', createdBy, new Date());
            await this.attendanceRepo.saveSession(session);
        }
        return session;
    }
}
exports.AttendanceSessionService = AttendanceSessionService;
