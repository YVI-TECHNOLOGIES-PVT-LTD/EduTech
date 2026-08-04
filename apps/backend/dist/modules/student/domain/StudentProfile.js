"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfile = void 0;
class StudentProfile {
    constructor(id, studentId, dateOfBirth, gender, bloodGroup, nationality, religion, category, aadhaar, photoUrl, allergies, medicalConditions, emergencyNotes, createdAt, updatedAt) {
        this.id = id;
        this.studentId = studentId;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.bloodGroup = bloodGroup;
        this.nationality = nationality;
        this.religion = religion;
        this.category = category;
        this.aadhaar = aadhaar;
        this.photoUrl = photoUrl;
        this.allergies = allergies;
        this.medicalConditions = medicalConditions;
        this.emergencyNotes = emergencyNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.StudentProfile = StudentProfile;
