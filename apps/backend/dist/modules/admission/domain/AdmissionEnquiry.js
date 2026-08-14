"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionEnquiry = void 0;
class AdmissionEnquiry {
    constructor(id, schoolId, academicYearId, studentName, gradeAppliedFor, parentName, parentEmail, parentPhone, source, status, createdAt, updatedAt, deletedAt = null, dateOfBirth = null, gender = null, currentSchool = null, address = null, remarks = null, queryType = null) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.studentName = studentName;
        this.gradeAppliedFor = gradeAppliedFor;
        this.parentName = parentName;
        this.parentEmail = parentEmail;
        this.parentPhone = parentPhone;
        this.source = source;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.currentSchool = currentSchool;
        this.address = address;
        this.remarks = remarks;
        this.queryType = queryType;
    }
    convert() {
        this.status = 'converted';
        this.updatedAt = new Date();
    }
    lose() {
        this.status = 'lost';
        this.updatedAt = new Date();
    }
    softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.AdmissionEnquiry = AdmissionEnquiry;
