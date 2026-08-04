"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequest = void 0;
class LeaveRequest {
    constructor(id, studentId, leaveTypeId, startDate, endDate, reason, status, createdAt, updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.leaveTypeId = leaveTypeId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    transitionStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
exports.LeaveRequest = LeaveRequest;
