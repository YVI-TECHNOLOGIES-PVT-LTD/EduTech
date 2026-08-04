"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interview = void 0;
class Interview {
    constructor(id, applicationId, panelId, interviewDate, roomName, status, remarks, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.panelId = panelId;
        this.interviewDate = interviewDate;
        this.roomName = roomName;
        this.status = status;
        this.remarks = remarks;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    transition(newStatus, remarks) {
        this.status = newStatus;
        if (remarks)
            this.remarks = remarks;
        this.updatedAt = new Date();
    }
}
exports.Interview = Interview;
