"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const AdmissionApplication_1 = require("../domain/AdmissionApplication");
const BaseRepository_1 = require("./BaseRepository");
class AdmissionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('admissions');
    }
    toDomain(row) {
        return new AdmissionApplication_1.AdmissionApplication(row.id, row.school_id, row.academic_year_id, row.applicant_user_id, row.student_name, new Date(row.date_of_birth), row.gender, row.grade_applied_for, row.status, new Date(row.created_at), new Date(row.updated_at), row.deleted_at ? new Date(row.deleted_at) : null);
    }
    toPersistence(domain) {
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
    async findById(id) {
        const { data, error } = await this.activeQuery.eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async save(application) {
        const payload = this.toPersistence(application);
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return this.toDomain(data);
    }
    async softDelete(id) {
        await this.performSoftDelete(id);
    }
}
exports.AdmissionRepository = AdmissionRepository;
