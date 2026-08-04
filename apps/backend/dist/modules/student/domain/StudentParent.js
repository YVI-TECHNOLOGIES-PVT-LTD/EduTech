"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentParent = void 0;
class StudentParent {
    constructor(id, studentId, parentName, relation, mobileNumber, email, occupation, aadhaar, createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.parentName = parentName;
        this.relation = relation;
        this.mobileNumber = mobileNumber;
        this.email = email;
        this.occupation = occupation;
        this.aadhaar = aadhaar;
        this.createdAt = createdAt;
    }
}
exports.StudentParent = StudentParent;
