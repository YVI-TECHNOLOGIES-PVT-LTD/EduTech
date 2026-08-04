"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrollment = void 0;
class Enrollment {
    constructor(id, applicationId, studentId, admissionNumber, enrolledAt, enrolledBy) {
        this.id = id;
        this.applicationId = applicationId;
        this.studentId = studentId;
        this.admissionNumber = admissionNumber;
        this.enrolledAt = enrolledAt;
        this.enrolledBy = enrolledBy;
    }
}
exports.Enrollment = Enrollment;
