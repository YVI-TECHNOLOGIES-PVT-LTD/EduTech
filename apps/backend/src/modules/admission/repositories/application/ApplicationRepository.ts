import { BaseRepository } from '../BaseRepository';
import { IApplicationRepository } from '../interfaces/IApplicationRepository';
import { AdmissionApplication, ApplicationStatus } from '../../domain/application/AdmissionApplication';
import { ApplicationProfile } from '../../domain/application/ApplicationProfile';
import { ApplicationDeclaration } from '../../domain/application/ApplicationDeclaration';
import { supabase } from '../../../../config/supabase';

export class ApplicationRepository extends BaseRepository<AdmissionApplication> implements IApplicationRepository {
    constructor() {
        super('admission_applications');
    }

    protected toDomain(row: any): AdmissionApplication {
        return new AdmissionApplication(
            row.id,
            row.school_id,
            row.academic_year_id,
            row.lead_id,
            row.status as ApplicationStatus,
            row.version,
            row.is_current,
            row.created_by,
            row.change_reason,
            row.submitted_at ? new Date(row.submitted_at) : null,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.deleted_at ? new Date(row.deleted_at) : null
        );
    }

    public async findById(id: string): Promise<AdmissionApplication | null> {
        const { data, error } = await supabase
            .from('admission_applications')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle();

        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async findAllSubmitted(schoolId: string, academicYearId: string): Promise<AdmissionApplication[]> {
        const { data, error } = await supabase
            .from('admission_applications')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('status', 'SUBMITTED')
            .is('deleted_at', null);

        if (error) throw error;
        return (data || []).map(row => this.toDomain(row));
    }

    public async getGradeForApplication(applicationId: string): Promise<string> {
        const app = await this.findById(applicationId);
        if (!app || !app.leadId) {
            return 'Grade 1';
        }

        const { data: lead, error: leadErr } = await supabase
            .from('admission_leads')
            .select('enquiry_id')
            .eq('id', app.leadId)
            .maybeSingle();

        if (leadErr || !lead || !lead.enquiry_id) {
            return 'Grade 1';
        }

        const { data: enquiry, error: enquiryErr } = await supabase
            .from('admission_enquiries')
            .select('grade_applied_for')
            .eq('id', lead.enquiry_id)
            .maybeSingle();

        if (enquiryErr || !enquiry) {
            return 'Grade 1';
        }

        return enquiry.grade_applied_for;
    }

    public async getApplicantDisplayInfo(applicationId: string): Promise<{
        studentName: string;
        parentEmail: string | null;
        parentPhone: string | null;
    }> {
        const app = await this.findById(applicationId);
        if (!app?.leadId) {
            return { studentName: 'Student', parentEmail: null, parentPhone: null };
        }

        const { data: lead } = await supabase
            .from('admission_leads')
            .select('enquiry_id')
            .eq('id', app.leadId)
            .maybeSingle();

        if (!lead?.enquiry_id) {
            return { studentName: 'Student', parentEmail: null, parentPhone: null };
        }

        const { data: enquiry } = await supabase
            .from('admission_enquiries')
            .select('student_name, parent_email, parent_phone')
            .eq('id', lead.enquiry_id)
            .maybeSingle();

        const { data: parentRow } = await supabase
            .from('application_parents')
            .select('email, mobile_number')
            .eq('application_id', applicationId)
            .limit(1)
            .maybeSingle();

        return {
            studentName: enquiry?.student_name ?? 'Student',
            parentEmail: parentRow?.email ?? enquiry?.parent_email ?? null,
            parentPhone: parentRow?.mobile_number ?? enquiry?.parent_phone ?? null,
        };
    }

    public async findCurrentByLeadId(leadId: string): Promise<AdmissionApplication | null> {
        const { data, error } = await supabase
            .from('admission_applications')
            .select('*')
            .eq('lead_id', leadId)
            .eq('is_current', true)
            .is('deleted_at', null)
            .maybeSingle();

        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async findCurrentIdsByLeadIds(leadIds: string[]): Promise<Map<string, string>> {
        if (!leadIds.length) return new Map();
        const { data, error } = await supabase
            .from('admission_applications')
            .select('id, lead_id')
            .in('lead_id', leadIds)
            .eq('is_current', true)
            .is('deleted_at', null);

        if (error) throw error;
        return new Map((data ?? []).map(row => [row.lead_id, row.id]));
    }

    public async findCurrentByDetails(studentName: string, dateOfBirth: Date, academicYearId: string): Promise<AdmissionApplication | null> {
        const dobStr = dateOfBirth.toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('admission_applications')
            .select('*, application_profiles!inner(*)')
            .eq('academic_year_id', academicYearId)
            .eq('is_current', true)
            .is('deleted_at', null)
            .eq('application_profiles.date_of_birth', dobStr);

        if (error) throw error;
        if (!data?.length) return null;

        const normalizedName = studentName.trim().toLowerCase();
        for (const row of data) {
            if (!row.lead_id) continue;
            const { data: lead } = await supabase
                .from('admission_leads')
                .select('enquiry_id')
                .eq('id', row.lead_id)
                .maybeSingle();
            if (!lead?.enquiry_id) continue;
            const { data: enquiry } = await supabase
                .from('admission_enquiries')
                .select('student_name')
                .eq('id', lead.enquiry_id)
                .maybeSingle();
            if (enquiry?.student_name?.toLowerCase() === normalizedName) {
                return this.toDomain(row);
            }
        }
        return null;
    }

    public async save(application: AdmissionApplication): Promise<void> {
        const payload = {
            id: application.id,
            school_id: application.schoolId,
            academic_year_id: application.academicYearId,
            lead_id: application.leadId,
            status: application.status,
            version: application.version,
            is_current: application.isCurrent,
            created_by: application.createdBy,
            change_reason: application.changeReason,
            submitted_at: application.submittedAt?.toISOString() || null,
            updated_at: application.updatedAt.toISOString(),
            deleted_at: application.deletedAt?.toISOString() || null
        };

        const { error } = await supabase
            .from('admission_applications')
            .upsert(payload);

        if (error) throw error;
    }

    public async findTimeline(applicationId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('application_workflow')
            .select('*')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    public async findProfile(applicationId: string): Promise<ApplicationProfile | null> {
        const { data, error } = await supabase
            .from('application_profiles')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return new ApplicationProfile(
            data.id,
            data.application_id,
            new Date(data.date_of_birth),
            data.gender,
            data.blood_group,
            data.nationality,
            data.religion,
            data.category,
            data.aadhaar,
            data.photo_url,
            data.allergies,
            data.medical_conditions,
            data.emergency_notes,
            new Date(data.created_at),
            new Date(data.updated_at)
        );
    }

    public async saveProfile(profile: ApplicationProfile): Promise<void> {
        const payload = {
            id: profile.id,
            application_id: profile.applicationId,
            date_of_birth: profile.dateOfBirth.toISOString().split('T')[0],
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
        };

        const { error } = await supabase
            .from('application_profiles')
            .upsert(payload);

        if (error) throw error;
    }

    public async findParents(applicationId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('application_parents')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    }

    public async saveParents(applicationId: string, parentsData: any): Promise<void> {
        const payload = {
            application_id: applicationId,
            ...parentsData,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('application_parents')
            .upsert(payload);

        if (error) throw error;
    }

    public async findPreviousEducation(applicationId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('application_previous_education')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    }

    public async savePreviousEducation(applicationId: string, eduData: any): Promise<void> {
        const payload = {
            application_id: applicationId,
            ...eduData,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('application_previous_education')
            .upsert(payload);

        if (error) throw error;
    }

    public async findPreferences(applicationId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('application_preferences')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    }

    public async savePreferences(applicationId: string, prefData: any): Promise<void> {
        const payload = {
            application_id: applicationId,
            ...prefData,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('application_preferences')
            .upsert(payload);

        if (error) throw error;
    }

    public async findDeclaration(applicationId: string): Promise<ApplicationDeclaration | null> {
        const { data, error } = await supabase
            .from('application_declarations')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return new ApplicationDeclaration(
            data.id,
            data.application_id,
            data.agreed_to_terms,
            data.parent_signature,
            data.date_signed ? new Date(data.date_signed) : null,
            new Date(data.created_at),
            new Date(data.updated_at)
        );
    }

    public async saveDeclaration(declaration: ApplicationDeclaration): Promise<void> {
        const payload = {
            id: declaration.id,
            application_id: declaration.applicationId,
            agreed_to_terms: declaration.agreedToTerms,
            parent_signature: declaration.parentSignature,
            date_signed: declaration.dateSigned ? declaration.dateSigned.toISOString().split('T')[0] : null,
            updated_at: declaration.updatedAt.toISOString()
        };

        const { error } = await supabase
            .from('application_declarations')
            .upsert(payload);

        if (error) throw error;
    }

    public async logWorkflow(
        applicationId: string, 
        action: string, 
        fromStatus: string | null, 
        toStatus: string, 
        performedBy: string | null, 
        notes?: string | null
    ): Promise<void> {
        const { error } = await supabase
            .from('application_workflow')
            .insert({
                application_id: applicationId,
                action,
                from_status: fromStatus,
                to_status: toStatus,
                performed_by: performedBy,
                notes
            });

        if (error) throw error;
    }

    public async getAgeRule(grade: string): Promise<{ min_age: number, max_age: number } | null> {
        const { data, error } = await supabase
            .from('admission_age_rules')
            .select('min_age, max_age')
            .eq('grade', grade)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }

    public async findByParentUser(userId: string, userEmail: string): Promise<AdmissionApplication[]> {
        await this.linkOrphanApplicationsToParent(userId, userEmail);

        const { data: byCreator, error: creatorErr } = await supabase
            .from('admission_applications')
            .select('*')
            .eq('created_by', userId)
            .eq('is_current', true)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });

        if (creatorErr) throw creatorErr;
        const apps = new Map<string, AdmissionApplication>();
        for (const row of byCreator ?? []) {
            apps.set(row.id, this.toDomain(row));
        }

        const normalizedEmail = userEmail.trim().toLowerCase();
        if (normalizedEmail) {
            const { data: parentRows } = await supabase
                .from('application_parents')
                .select('application_id, father_email, mother_email, guardian_email')
                .or(`father_email.ilike.${normalizedEmail},mother_email.ilike.${normalizedEmail},guardian_email.ilike.${normalizedEmail}`);

            for (const row of parentRows ?? []) {
                if (!row.application_id || apps.has(row.application_id)) continue;
                const { data: appRow } = await supabase
                    .from('admission_applications')
                    .select('*')
                    .eq('id', row.application_id)
                    .eq('is_current', true)
                    .is('deleted_at', null)
                    .maybeSingle();
                if (appRow) apps.set(appRow.id, this.toDomain(appRow));
            }
        }

        return Array.from(apps.values());
    }

    public async linkOrphanApplicationsToParent(userId: string, userEmail: string): Promise<void> {
        const normalizedEmail = userEmail.trim().toLowerCase();
        if (!normalizedEmail) return;

        const { data: enquiries } = await supabase
            .from('admission_enquiries')
            .select('id')
            .ilike('parent_email', normalizedEmail);

        for (const enquiry of enquiries ?? []) {
            const { data: lead } = await supabase
                .from('admission_leads')
                .select('id')
                .eq('enquiry_id', enquiry.id)
                .maybeSingle();
            if (!lead) continue;

            await supabase
                .from('admission_applications')
                .update({ created_by: userId, updated_at: new Date().toISOString() })
                .eq('lead_id', lead.id)
                .is('created_by', null);
        }

        const { data: parentApps } = await supabase
            .from('application_parents')
            .select('application_id')
            .or(`father_email.ilike.${normalizedEmail},mother_email.ilike.${normalizedEmail},guardian_email.ilike.${normalizedEmail}`);

        for (const row of parentApps ?? []) {
            if (!row.application_id) continue;
            await supabase
                .from('admission_applications')
                .update({ created_by: userId, updated_at: new Date().toISOString() })
                .eq('id', row.application_id)
                .is('created_by', null);
        }
    }

    public async isOwnedByParent(applicationId: string, userId: string, userEmail: string): Promise<boolean> {
        const app = await this.findById(applicationId);
        if (!app) return false;
        if (app.createdBy === userId) return true;

        const normalizedEmail = userEmail.trim().toLowerCase();
        if (!normalizedEmail) return false;

        const parents = await this.findParents(applicationId);
        if (parents) {
            const emails = [parents.father_email, parents.mother_email, parents.guardian_email]
                .filter(Boolean)
                .map((e: string) => e.toLowerCase());
            if (emails.includes(normalizedEmail)) return true;
        }

        if (app.leadId) {
            const { data: lead } = await supabase
                .from('admission_leads')
                .select('enquiry_id')
                .eq('id', app.leadId)
                .maybeSingle();
            if (lead?.enquiry_id) {
                const { data: enquiry } = await supabase
                    .from('admission_enquiries')
                    .select('parent_email')
                    .eq('id', lead.enquiry_id)
                    .maybeSingle();
                if (enquiry?.parent_email?.toLowerCase() === normalizedEmail) return true;
            }
        }

        return false;
    }

    public async findAllPaginated(filters: {
        schoolId: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: any[]; total: number }> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('admission_applications')
            .select(`
                id, status, school_id, academic_year_id, created_by, created_at, updated_at, submitted_at,
                lead:lead_id (
                    enquiry:enquiry_id (
                        student_name, parent_email, parent_phone, grade_applied_for, parent_name
                    )
                )
            `, { count: 'exact' })
            .eq('school_id', filters.schoolId)
            .eq('is_current', true)
            .is('deleted_at', null);

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, count, error } = await query
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        let rows = data ?? [];
        if (filters.search) {
            const term = filters.search.toLowerCase();
            rows = rows.filter((row: any) => {
                const enquiry = row.lead?.enquiry;
                const studentName = enquiry?.student_name?.toLowerCase() ?? '';
                const parentEmail = enquiry?.parent_email?.toLowerCase() ?? '';
                const parentPhone = enquiry?.parent_phone?.toLowerCase() ?? '';
                return studentName.includes(term) || parentEmail.includes(term) || parentPhone.includes(term) || row.id.includes(term);
            });
        }

        const enriched = rows.map((row: any) => {
            const enquiry = row.lead?.enquiry ?? {};
            return {
                id: row.id,
                status: (row.status ?? 'DRAFT').toLowerCase(),
                school_id: row.school_id,
                academic_year_id: row.academic_year_id,
                applicant_user_id: row.created_by,
                student_name: enquiry.student_name ?? 'Applicant',
                grade_applied_for: enquiry.grade_applied_for ?? '',
                parent_name: enquiry.parent_name ?? '',
                parent_email: enquiry.parent_email ?? '',
                parent_phone: enquiry.parent_phone ?? '',
                created_at: row.created_at,
                updated_at: row.updated_at,
                submitted_at: row.submitted_at,
            };
        });

        return { data: enriched, total: count ?? enriched.length };
    }

    public async findAllForStats(schoolId?: string): Promise<Array<{ id: string; status: string; created_at: string; updated_at: string }>> {
        let query = supabase
            .from('admission_applications')
            .select('id, status, created_at, updated_at')
            .eq('is_current', true)
            .is('deleted_at', null);

        if (schoolId) {
            query = query.eq('school_id', schoolId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []).map(row => ({
            id: row.id,
            status: (row.status ?? 'DRAFT').toLowerCase(),
            created_at: row.created_at,
            updated_at: row.updated_at,
        }));
    }
}
