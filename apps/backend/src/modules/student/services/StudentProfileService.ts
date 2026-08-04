import { StudentRepository } from '../repositories/StudentRepository';
import { StudentProfile } from '../domain/StudentProfile';
import { StudentParent } from '../domain/StudentParent';
import { AuditService } from '../../admission/services/AuditService';

export class StudentProfileService {
    constructor(
        private readonly studentRepo: StudentRepository,
        private readonly auditService: AuditService
    ) {}

    public async updateProfile(
        studentId: string,
        payload: Partial<StudentProfile>,
        performedBy: string | null,
        correlationId?: string
    ): Promise<StudentProfile> {
        let profile = await this.studentRepo.findProfile(studentId);
        if (!profile) {
            profile = new StudentProfile(
                crypto.randomUUID(),
                studentId,
                new Date(),
                'Other',
                null, null, null, null, null, null, null, null, null,
                new Date(),
                new Date()
            );
        }

        const updatedProfile = new StudentProfile(
            profile.id,
            profile.studentId,
            payload.dateOfBirth || profile.dateOfBirth,
            payload.gender || profile.gender,
            payload.bloodGroup !== undefined ? payload.bloodGroup : profile.bloodGroup,
            payload.nationality !== undefined ? payload.nationality : profile.nationality,
            payload.religion !== undefined ? payload.religion : profile.religion,
            payload.category !== undefined ? payload.category : profile.category,
            payload.aadhaar !== undefined ? payload.aadhaar : profile.aadhaar,
            payload.photoUrl !== undefined ? payload.photoUrl : profile.photoUrl,
            payload.allergies !== undefined ? payload.allergies : profile.allergies,
            payload.medicalConditions !== undefined ? payload.medicalConditions : profile.medicalConditions,
            payload.emergencyNotes !== undefined ? payload.emergencyNotes : profile.emergencyNotes,
            profile.createdAt,
            new Date()
        );

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

    public async addParent(
        studentId: string,
        payload: {
            parentName: string;
            relation: 'Father' | 'Mother' | 'Stepfather' | 'Stepmother';
            mobileNumber?: string;
            email?: string;
            occupation?: string;
            aadhaar?: string;
        },
        performedBy: string | null,
        correlationId?: string
    ): Promise<StudentParent> {
        const parent = new StudentParent(
            crypto.randomUUID(),
            studentId,
            payload.parentName,
            payload.relation,
            payload.mobileNumber || null,
            payload.email || null,
            payload.occupation || null,
            payload.aadhaar || null,
            new Date()
        );
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
