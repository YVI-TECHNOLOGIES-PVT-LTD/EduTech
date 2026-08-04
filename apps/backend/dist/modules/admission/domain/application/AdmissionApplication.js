"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionApplication = void 0;
class AdmissionApplication {
    constructor(id, schoolId, academicYearId, leadId, status, version, isCurrent, createdBy, changeReason, submittedAt, createdAt, updatedAt, deletedAt = null) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.leadId = leadId;
        this.status = status;
        this.version = version;
        this.isCurrent = isCurrent;
        this.createdBy = createdBy;
        this.changeReason = changeReason;
        this.submittedAt = submittedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }
    updateStatus(newStatus, reason) {
        this.status = newStatus;
        if (reason !== undefined) {
            this.changeReason = reason;
        }
        if (newStatus === 'SUBMITTED') {
            this.submittedAt = new Date();
        }
        this.updatedAt = new Date();
    }
    incrementVersion(reason) {
        this.version += 1;
        if (reason !== undefined) {
            this.changeReason = reason;
        }
        this.updatedAt = new Date();
    }
    softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.AdmissionApplication = AdmissionApplication;
