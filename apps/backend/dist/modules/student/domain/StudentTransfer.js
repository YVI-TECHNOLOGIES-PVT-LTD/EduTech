"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentTransfer = void 0;
class StudentTransfer {
    constructor(id, studentId, destinationSchool, reason, requestedAt, status) {
        this.id = id;
        this.studentId = studentId;
        this.destinationSchool = destinationSchool;
        this.reason = reason;
        this.requestedAt = requestedAt;
        this.status = status;
    }
    approve() {
        this.status = 'APPROVED';
    }
    reject() {
        this.status = 'REJECTED';
    }
}
exports.StudentTransfer = StudentTransfer;
