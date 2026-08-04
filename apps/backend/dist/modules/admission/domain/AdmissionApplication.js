"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionApplication = void 0;
class AdmissionApplication {
    constructor(id, schoolId, academicYearId, applicantUserId, studentName, dateOfBirth, gender, gradeAppliedFor, status, createdAt, updatedAt, deletedAt = null) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.applicantUserId = applicantUserId;
        this.studentName = studentName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.gradeAppliedFor = gradeAppliedFor;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }
    updateStatus(status) {
        this.status = status;
        this.updatedAt = new Date();
    }
    softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.AdmissionApplication = AdmissionApplication;
