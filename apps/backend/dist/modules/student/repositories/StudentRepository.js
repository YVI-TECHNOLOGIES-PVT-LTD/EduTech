"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentRepository = void 0;
const Student_1 = require("../domain/Student");
const StudentProfile_1 = require("../domain/StudentProfile");
const StudentParent_1 = require("../domain/StudentParent");
const supabase_1 = require("../../../config/supabase");
class StudentRepository {
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('students')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Student_1.Student(data.id, data.user_id, data.admission_no, data.first_name, data.last_name, data.status, data.school_id, data.academic_year_id, new Date(data.created_at), new Date(data.updated_at), data.deleted_at ? new Date(data.deleted_at) : null) : null;
    }
    async findByAdmissionNo(admissionNo) {
        const { data, error } = await supabase_1.supabase
            .from('students')
            .select('*')
            .eq('admission_no', admissionNo)
            .is('deleted_at', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Student_1.Student(data.id, data.user_id, data.admission_no, data.first_name, data.last_name, data.status, data.school_id, data.academic_year_id, new Date(data.created_at), new Date(data.updated_at), data.deleted_at ? new Date(data.deleted_at) : null) : null;
    }
    async save(student) {
        const { error } = await supabase_1.supabase
            .from('students')
            .upsert({
            id: student.id,
            user_id: student.userId,
            admission_no: student.admissionNo,
            first_name: student.firstName,
            last_name: student.lastName,
            status: student.status,
            school_id: student.schoolId,
            academic_year_id: student.academicYearId,
            updated_at: student.updatedAt.toISOString(),
            deleted_at: student.deletedAt ? student.deletedAt.toISOString() : null
        });
        if (error)
            throw error;
    }
    async findProfile(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_profiles')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new StudentProfile_1.StudentProfile(data.id, data.student_id, new Date(data.date_of_birth), data.gender, data.blood_group, data.nationality, data.religion, data.category, data.aadhaar, data.photo_url, data.allergies, data.medical_conditions, data.emergency_notes, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async saveProfile(profile) {
        const { error } = await supabase_1.supabase
            .from('student_profiles')
            .upsert({
            id: profile.id,
            student_id: profile.studentId,
            date_of_birth: profile.dateOfBirth.toISOString().substring(0, 10),
            gender: profile.gender,
            blood_group: profile.bloodGroup,
            nationality: profile.nationality,
            religion: profile.religion,
            category: profile.category,
            aadhaar: profile.aadhaar,
            photo_url: profile.photoUrl,
            allergies: profile.allergies,
            medical_conditions: profile.medicalConditions,
            emergency_notes: profile.emergencyNotes,
            updated_at: profile.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async findParents(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_parents')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        return (data || []).map((row) => new StudentParent_1.StudentParent(row.id, row.student_id, row.parent_name, row.relation, row.mobile_number, row.email, row.occupation, row.aadhaar, new Date(row.created_at)));
    }
    async saveParent(parent) {
        const { error } = await supabase_1.supabase
            .from('student_parents')
            .upsert({
            id: parent.id,
            student_id: parent.studentId,
            parent_name: parent.parentName,
            relation: parent.relation,
            mobile_number: parent.mobileNumber,
            email: parent.email,
            occupation: parent.occupation,
            aadhaar: parent.aadhaar
        });
        if (error)
            throw error;
    }
    async findGuardians(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_guardians')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        return data || [];
    }
    async saveGuardian(guardian) {
        const { error } = await supabase_1.supabase
            .from('student_guardians')
            .upsert(guardian);
        if (error)
            throw error;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('student_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
    async logStatusChange(change) {
        const { error } = await supabase_1.supabase
            .from('student_status_history')
            .insert(change);
        if (error)
            throw error;
    }
    async findTimeline(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_status_history')
            .select('*')
            .eq('student_id', studentId)
            .order('changed_at', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    async list(params) {
        let query = supabase_1.supabase
            .from('students')
            .select('*, student_sections(section_id, academic_year_id)', { count: 'exact' })
            .is('deleted_at', null);
        if (params.school_id) {
            query = query.eq('school_id', params.school_id);
        }
        if (params.status) {
            query = query.eq('status', params.status);
        }
        if (params.academic_year) {
            query = query.eq('academic_year_id', params.academic_year);
        }
        if (params.search) {
            query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,admission_no.ilike.%${params.search}%`);
        }
        const from = (params.page - 1) * params.limit;
        const to = params.page * params.limit - 1;
        const { data, count, error } = await query
            .range(from, to)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return { data: data || [], total: count || 0 };
    }
}
exports.StudentRepository = StudentRepository;
