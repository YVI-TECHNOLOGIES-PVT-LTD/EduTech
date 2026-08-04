"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionFollowup = void 0;
class AdmissionFollowup {
    constructor(id, leadId, scheduledDate, completedDate, status, notes, createdBy, createdAt, updatedAt) {
        this.id = id;
        this.leadId = leadId;
        this.scheduledDate = scheduledDate;
        this.completedDate = completedDate;
        this.status = status;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    complete(notes) {
        this.status = 'completed';
        this.completedDate = new Date();
        this.updatedAt = new Date();
        if (notes !== undefined) {
            this.notes = notes;
        }
    }
    miss() {
        this.status = 'missed';
        this.updatedAt = new Date();
    }
    cancel(notes) {
        this.status = 'cancelled';
        this.updatedAt = new Date();
        if (notes !== undefined) {
            this.notes = notes;
        }
    }
}
exports.AdmissionFollowup = AdmissionFollowup;
