"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallTicket = void 0;
class HallTicket {
    constructor(id, applicationId, examScheduleId, hallTicketNumber, examRoom, reportingTime, qrCodePath, createdAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.examScheduleId = examScheduleId;
        this.hallTicketNumber = hallTicketNumber;
        this.examRoom = examRoom;
        this.reportingTime = reportingTime;
        this.qrCodePath = qrCodePath;
        this.createdAt = createdAt;
    }
}
exports.HallTicket = HallTicket;
