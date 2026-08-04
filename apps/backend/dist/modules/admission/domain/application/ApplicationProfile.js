"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationProfile = void 0;
class ApplicationProfile {
    constructor(id, applicationId, dateOfBirth, gender, bloodGroup, nationality, religion, category, aadhaar, photoUrl, allergies, medicalConditions, emergencyNotes, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
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
    update(data) {
        Object.assign(this, {
            ...data,
            updatedAt: new Date()
        });
    }
}
exports.ApplicationProfile = ApplicationProfile;
