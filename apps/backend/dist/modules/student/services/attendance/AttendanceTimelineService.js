"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceTimelineService = void 0;
class AttendanceTimelineService {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async getTimeline(studentId) {
        // Return blank log timeline
        return [];
    }
}
exports.AttendanceTimelineService = AttendanceTimelineService;
