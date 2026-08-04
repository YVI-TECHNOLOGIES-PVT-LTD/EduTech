"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfileService = void 0;
const StudentProfile_1 = require("../domain/StudentProfile");
const StudentParent_1 = require("../domain/StudentParent");
class StudentProfileService {
    constructor(studentRepo, auditService) {
        this.studentRepo = studentRepo;
        this.auditService = auditService;
    }
    async updateProfile(studentId, payload, performedBy, correlationId) {
        let profile = await this.studentRepo.findProfile(studentId);
        if (!profile) {
            profile = new StudentProfile_1.StudentProfile(crypto.randomUUID(), studentId, new Date(), 'Other', null, null, null, null, null, null, null, null, null, new Date(), new Date());
        }
        const updatedProfile = new StudentProfile_1.StudentProfile(profile.id, profile.studentId, payload.dateOfBirth || profile.dateOfBirth, payload.gender || profile.gender, payload.bloodGroup !== undefined ? payload.bloodGroup : profile.bloodGroup, payload.nationality !== undefined ? payload.nationality : profile.nationality, payload.religion !== undefined ? payload.religion : profile.religion, payload.category !== undefined ? payload.category : profile.category, payload.aadhaar !== undefined ? payload.aadhaar : profile.aadhaar, payload.photoUrl !== undefined ? payload.photoUrl : profile.photoUrl, payload.allergies !== undefined ? payload.allergies : profile.allergies, payload.medicalConditions !== undefined ? payload.medicalConditions : profile.medicalConditions, payload.emergencyNotes !== undefined ? payload.emergencyNotes : profile.emergencyNotes, profile.createdAt, new Date());
        await this.studentRepo.saveProfile(updatedProfile);
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'STUDENT_PROFILE_UPDATED',
            entityName: 'student_profiles',
            entityId: updatedProfile.id,
            afterState: payload,
            userId: performedBy,
            correlationId
        });
        return updatedProfile;
    }
    async addParent(studentId, payload, performedBy, correlationId) {
        const parent = new StudentParent_1.StudentParent(crypto.randomUUID(), studentId, payload.parentName, payload.relation, payload.mobileNumber || null, payload.email || null, payload.occupation || null, payload.aadhaar || null, new Date());
        await this.studentRepo.saveParent(parent);
        // Audit log
        await this.auditService.logAudit({
            action: 'STUDENT_PARENT_ADDED',
            entityName: 'student_parents',
            entityId: parent.id,
            afterState: { relation: parent.relation },
            userId: performedBy,
            correlationId
        });
        return parent;
    }
}
exports.StudentProfileService = StudentProfileService;
