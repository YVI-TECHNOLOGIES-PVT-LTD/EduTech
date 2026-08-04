"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionConfirmation = void 0;
class AdmissionConfirmation {
    constructor(id, applicationId, studentId, admissionNumber, confirmedAt, confirmedBy) {
        this.id = id;
        this.applicationId = applicationId;
        this.studentId = studentId;
        this.admissionNumber = admissionNumber;
        this.confirmedAt = confirmedAt;
        this.confirmedBy = confirmedBy;
    }
    linkStudent(studentId) {
        this.studentId = studentId;
    }
}
exports.AdmissionConfirmation = AdmissionConfirmation;
