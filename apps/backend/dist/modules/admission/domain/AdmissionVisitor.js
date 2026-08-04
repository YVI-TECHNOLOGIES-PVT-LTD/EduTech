"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionVisitor = void 0;
class AdmissionVisitor {
    constructor(id, schoolId, visitorName, phone, purpose, timeIn, timeOut, leadId, createdBy, createdAt, counselorId = null, remarks = null, visitType = null, visitOutcome = null) {
        this.id = id;
        this.schoolId = schoolId;
        this.visitorName = visitorName;
        this.phone = phone;
        this.purpose = purpose;
        this.timeIn = timeIn;
        this.timeOut = timeOut;
        this.leadId = leadId;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.counselorId = counselorId;
        this.remarks = remarks;
        this.visitType = visitType;
        this.visitOutcome = visitOutcome;
    }
    checkOut(outcome = null) {
        this.timeOut = new Date();
        if (outcome) {
            this.visitOutcome = outcome;
        }
    }
}
exports.AdmissionVisitor = AdmissionVisitor;
