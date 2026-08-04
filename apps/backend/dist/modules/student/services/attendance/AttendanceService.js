"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const Attendance_1 = require("../../domain/attendance/Attendance");
class AttendanceService {
    constructor(attendanceRepo, studentRepo, validationCoordinator, auditService) {
        this.attendanceRepo = attendanceRepo;
        this.studentRepo = studentRepo;
        this.validationCoordinator = validationCoordinator;
        this.auditService = auditService;
    }
    async markAttendance(sessionId, studentId, status, remarks, markedBy, correlationId) {
        const session = await this.attendanceRepo.findSessionById(sessionId);
        if (!session) {
            throw new Error(`Attendance Session ID ${sessionId} not found`);
        }
        await this.validationCoordinator.validateDailyMarking(studentId, session.schoolId, session.date, sessionId);
        const attendance = new Attendance_1.Attendance(crypto.randomUUID(), sessionId, studentId, status, remarks, markedBy, new Date(), new Date());
        await this.attendanceRepo.save(attendance);
        await this.auditService.logAudit({
            action: 'STUDENT_ATTENDANCE_MARKED',
            entityName: 'student_attendance',
            entityId: attendance.id,
            afterState: { status },
            userId: markedBy,
            correlationId
        });
        return attendance;
    }
    async bulkMark(sessionId, records, markedBy, correlationId) {
        for (const item of records) {
            try {
                await this.markAttendance(sessionId, item.studentId, item.status, item.remarks || null, markedBy, correlationId);
            }
            catch (err) {
                if (!err.message.includes('already been marked') && !err.message.includes('holiday')) {
                    throw err;
                }
            }
        }
    }
}
exports.AttendanceService = AttendanceService;
