"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCaptureService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const AttendanceRecordRepository_1 = require("../repositories/AttendanceRecordRepository");
const AttendanceOutboxRepository_1 = require("../repositories/AttendanceOutboxRepository");
class AttendanceCaptureService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AttendanceRecordRepository_1.AttendanceRecordRepository();
        this.outboxRepo = new AttendanceOutboxRepository_1.AttendanceOutboxRepository();
    }
    async captureStudentMark(payload, userId, correlationId) {
        this.logInfo(`Capturing student attendance mark: student=${payload.student_id}, status=${payload.status}`, correlationId);
        const record = await this.repo.markAttendance({
            session_id: payload.session_id,
            student_id: payload.student_id,
            status: payload.status,
            source: payload.source
        }, userId);
        // Queue outbox event
        await this.outboxRepo.queueEvent('AttendanceMarked', {
            record_id: record.id,
            session_id: record.session_id,
            student_id: record.student_id,
            status: record.status
        });
        return record;
    }
}
exports.AttendanceCaptureService = AttendanceCaptureService;
exports.default = AttendanceCaptureService;
