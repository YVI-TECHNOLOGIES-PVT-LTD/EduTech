import { supabase } from '../../../../config/supabase';
import { AdmissionEnquiry, EnquirySource, EnquiryStatus } from '../../domain/AdmissionEnquiry';
import { IEnquiryRepository } from '../interfaces/IEnquiryRepository';
import { BaseRepository } from '../BaseRepository';

export class EnquiryRepository extends BaseRepository<AdmissionEnquiry> implements IEnquiryRepository {
    constructor() {
        super('admission_enquiries');
    }

    private toDomain(row: any): AdmissionEnquiry {
        return new AdmissionEnquiry(
            row.id,
            row.school_id,
            row.academic_year_id,
            row.student_name,
            row.grade_applied_for,
            row.parent_name,
            row.parent_email,
            row.parent_phone,
            row.source as EnquirySource,
            row.status as EnquiryStatus,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.deleted_at ? new Date(row.deleted_at) : null,
            row.date_of_birth ? new Date(row.date_of_birth) : null,
            row.gender || null,
            row.current_school || null,
            row.address || null,
            row.remarks || null
        );
    }

    private toPersistence(domain: AdmissionEnquiry): any {
        return {
            id: domain.id,
            school_id: domain.schoolId,
            academic_year_id: domain.academicYearId,
            student_name: domain.studentName,
            grade_applied_for: domain.gradeAppliedFor,
            parent_name: domain.parentName,
            parent_email: domain.parentEmail,
            parent_phone: domain.parentPhone,
            source: domain.source,
            status: domain.status,
            created_at: domain.createdAt.toISOString(),
            updated_at: domain.updatedAt.toISOString(),
            deleted_at: domain.deletedAt ? domain.deletedAt.toISOString() : null,
            date_of_birth: domain.dateOfBirth ? domain.dateOfBirth.toISOString().split('T')[0] : null,
            gender: domain.gender,
            current_school: domain.currentSchool,
            address: domain.address,
            remarks: domain.remarks
        };
    }

    public async findById(id: string): Promise<AdmissionEnquiry | null> {
        const { data, error } = await this.activeQuery.eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async findByPhone(phone: string): Promise<AdmissionEnquiry | null> {
        const { data, error } = await this.activeQuery.eq('parent_phone', phone).maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async save(enquiry: AdmissionEnquiry): Promise<AdmissionEnquiry> {
        const payload = this.toPersistence(enquiry);
        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return this.toDomain(data);
    }

    public async findAll(
        schoolId: string, 
        page: number = 1, 
        limit: number = 10,
        filters?: Record<string, any>,
        search?: string,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: AdmissionEnquiry[]; total: number }> {
        const baseQuery = supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .is('deleted_at', null)
            .eq('school_id', schoolId);

        const buildParams = {
            search,
            searchFields: ['student_name', 'parent_name', 'parent_email', 'parent_phone'],
            filter: filters,
            page,
            limit,
            sortColumn,
            sortOrder
        };

        const query = this.buildQuery(baseQuery, buildParams);
        const { data, count, error } = await query;

        if (error) throw error;
        return {
            data: (data || []).map((row: any) => this.toDomain(row)),
            total: count || 0
        };
    }

    public async softDelete(id: string): Promise<void> {
        await this.performSoftDelete(id);
    }

    public async findPossibleDuplicates(
        studentName: string,
        parentPhone: string,
        parentEmail: string,
        dateOfBirth: Date | null,
        gradeAppliedFor: string,
        academicYearId: string
    ): Promise<AdmissionEnquiry[]> {
        const query = this.activeQuery
            .eq('academic_year_id', academicYearId)
            .eq('grade_applied_for', gradeAppliedFor);

        const orConditions = [
            `parent_phone.eq.${parentPhone}`,
            `parent_email.eq.${parentEmail}`,
            `student_name.ilike.${studentName}`
        ];

        const { data, error } = await query.or(orConditions.join(','));
        if (error) throw error;
        return (data || []).map(row => this.toDomain(row));
    }
}
