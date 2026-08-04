"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCorrection = void 0;
class AttendanceCorrection {
    constructor(id, attendanceId, requestedStatus, reason, status, processedBy, processedAt, createdAt) {
        this.id = id;
        this.attendanceId = attendanceId;
        this.requestedStatus = requestedStatus;
        this.reason = reason;
        this.status = status;
        this.processedBy = processedBy;
        this.processedAt = processedAt;
        this.createdAt = createdAt;
    }
    approve(processedBy) {
        this.status = 'APPROVED';
        this.processedBy = processedBy;
        this.processedAt = new Date();
    }
    reject(processedBy) {
        this.status = 'REJECTED';
        this.processedBy = processedBy;
        this.processedAt = new Date();
    }
}
exports.AttendanceCorrection = AttendanceCorrection;
