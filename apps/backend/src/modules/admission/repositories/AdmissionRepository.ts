import { supabase } from '../../../config/supabase';
import { AdmissionApplication } from '../domain/AdmissionApplication';
import { IAdmissionRepository } from './interfaces/IAdmissionRepository';
import { BaseRepository } from './BaseRepository';

export class AdmissionRepository extends BaseRepository<AdmissionApplication> implements IAdmissionRepository {
    constructor() {
        super('admissions');
    }

    private toDomain(row: any): AdmissionApplication {
        return new AdmissionApplication(
            row.id,
            row.school_id,
            row.academic_year_id,
            row.applicant_user_id,
            row.student_name,
            new Date(row.date_of_birth),
            row.gender,
            row.grade_applied_for,
            row.status,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.deleted_at ? new Date(row.deleted_at) : null
        );
    }

    private toPersistence(domain: AdmissionApplication): any {
        return {
            id: domain.id,
            school_id: domain.schoolId,
            academic_year_id: domain.academicYearId,
            applicant_user_id: domain.applicantUserId,
            student_name: domain.studentName,
            date_of_birth: domain.dateOfBirth.toISOString().split('T')[0],
            gender: domain.gender,
            grade_applied_for: domain.gradeAppliedFor,
            status: domain.status,
            created_at: domain.createdAt.toISOString(),
            updated_at: domain.updatedAt.toISOString(),
            deleted_at: domain.deletedAt ? domain.deletedAt.toISOString() : null
        };
    }

    public async findById(id: string): Promise<AdmissionApplication | null> {
        const { data, error } = await this.activeQuery.eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async save(application: AdmissionApplication): Promise<AdmissionApplication> {
        const payload = this.toPersistence(application);
        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return this.toDomain(data);
    }

    public async softDelete(id: string): Promise<void> {
        await this.performSoftDelete(id);
    }
}
