"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricLog = void 0;
class BiometricLog {
    constructor(id, deviceCode, studentAdmissionNo, scanTimestamp, status, failureReason, createdAt) {
        this.id = id;
        this.deviceCode = deviceCode;
        this.studentAdmissionNo = studentAdmissionNo;
        this.scanTimestamp = scanTimestamp;
        this.status = status;
        this.failureReason = failureReason;
        this.createdAt = createdAt;
    }
}
exports.BiometricLog = BiometricLog;
