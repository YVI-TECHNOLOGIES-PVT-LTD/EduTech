"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionLead = void 0;
class AdmissionLead {
    constructor(id, enquiryId, counselorId, status, lostReason, createdAt, updatedAt, deletedAt = null) {
        this.id = id;
        this.enquiryId = enquiryId;
        this.counselorId = counselorId;
        this.status = status;
        this.lostReason = lostReason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }
    assignCounselor(counselorId) {
        this.counselorId = counselorId;
        this.status = 'CONTACTED';
        this.updatedAt = new Date();
    }
    updateStatus(status, lostReason = null) {
        this.status = status;
        if (status === 'LOST') {
            this.lostReason = lostReason;
        }
        else {
            this.lostReason = null;
        }
        this.updatedAt = new Date();
    }
    softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.AdmissionLead = AdmissionLead;
