"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const AdmissionEnquiry_1 = require("../../domain/AdmissionEnquiry");
const BaseRepository_1 = require("../BaseRepository");
class EnquiryRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('admission_enquiries');
    }
    toDomain(row) {
        return new AdmissionEnquiry_1.AdmissionEnquiry(row.id, row.school_id, row.academic_year_id, row.student_name, row.grade_applied_for, row.parent_name, row.parent_email, row.parent_phone, row.source, row.status, new Date(row.created_at), new Date(row.updated_at), row.deleted_at ? new Date(row.deleted_at) : null, row.date_of_birth ? new Date(row.date_of_birth) : null, row.gender || null, row.current_school || null, row.address || null, row.remarks || null);
    }
    toPersistence(domain) {
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
    async findById(id) {
        const { data, error } = await this.activeQuery.eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async findByPhone(phone) {
        const { data, error } = await this.activeQuery.eq('parent_phone', phone).maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async save(enquiry) {
        const payload = this.toPersistence(enquiry);
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return this.toDomain(data);
    }
    async findAll(schoolId, page = 1, limit = 10, filters, search, sortColumn, sortOrder) {
        const baseQuery = supabase_1.supabase
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
        if (error)
            throw error;
        return {
            data: (data || []).map((row) => this.toDomain(row)),
            total: count || 0
        };
    }
    async softDelete(id) {
        await this.performSoftDelete(id);
    }
    async findPossibleDuplicates(studentName, parentPhone, parentEmail, dateOfBirth, gradeAppliedFor, academicYearId) {
        const query = this.activeQuery
            .eq('academic_year_id', academicYearId)
            .eq('grade_applied_for', gradeAppliedFor);
        const orConditions = [
            `parent_phone.eq.${parentPhone}`,
            `parent_email.eq.${parentEmail}`,
            `student_name.ilike.${studentName}`
        ];
        const { data, error } = await query.or(orConditions.join(','));
        if (error)
            throw error;
        return (data || []).map(row => this.toDomain(row));
    }
}
exports.EnquiryRepository = EnquiryRepository;
