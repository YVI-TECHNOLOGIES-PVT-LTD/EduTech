"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
class Student {
    constructor(id, userId, admissionNo, firstName, lastName, status, schoolId, academicYearId, createdAt, updatedAt, deletedAt = null) {
        this.id = id;
        this.userId = userId;
        this.admissionNo = admissionNo;
        this.firstName = firstName;
        this.lastName = lastName;
        this.status = status;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }
    transitionStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
    softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.Student = Student;
