"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
class Attendance {
    constructor(id, sessionId, studentId, status, remarks, markedBy, markedAt, updatedAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.studentId = studentId;
        this.status = status;
        this.remarks = remarks;
        this.markedBy = markedBy;
        this.markedAt = markedAt;
        this.updatedAt = updatedAt;
    }
    transitionStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
exports.Attendance = Attendance;
