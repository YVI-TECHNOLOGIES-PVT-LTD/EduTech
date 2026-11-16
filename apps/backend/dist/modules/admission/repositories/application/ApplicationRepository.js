"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRepository = void 0;
const BaseRepository_1 = require("../BaseRepository");
const AdmissionApplication_1 = require("../../domain/application/AdmissionApplication");
const ApplicationDeclaration_1 = require("../../domain/application/ApplicationDeclaration");
const supabase_1 = require("../../../../config/supabase");
const prismaClient_1 = __importDefault(require("../../../../lib/prismaClient"));
class ApplicationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('admission_applications');
    }
    toDomain(row) {
        const app = new AdmissionApplication_1.AdmissionApplication(row.application_id || row.id, row.org_id || row.school_id, row.academic_year_id, row.lead_id, row.status, row.version || 1, row.is_current ?? true, row.created_by, row.change_reason, row.submitted_at ? new Date(row.submitted_at) : null, new Date(row.created_at), new Date(row.updated_at), row.deleted_at ? new Date(row.deleted_at) : null, row.application_number);
        app.applicationNumber = row.application_number;
        return app;
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_applications')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async findAllSubmitted(schoolId, academicYearId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_applications')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('status', 'SUBMITTED')
            .is('deleted_at', null);
        if (error)
            throw error;
        return (data || []).map((row) => this.toDomain(row));
    }
    async getGradeForApplication(applicationId) {
        const app = await this.findById(applicationId);
        if (!app?.leadId) {
            return 'Grade 1';
        }
        const lead = await prismaClient_1.default.leads.findUnique({
            where: { lead_id: app.leadId },
            include: {
                academic_year_grades: {
                    include: { grades: true },
                },
            },
        });
        if (!lead) {
            return 'Grade 1';
        }
        return (lead.academic_year_grades?.grades?.grade_name ||
            lead.academic_year_grades?.grades?.grade_code ||
            'Grade 1');
    }
    async getApplicantDisplayInfo(applicationId) {
        const app = await this.findById(applicationId);
        if (!app?.leadId) {
            return { studentName: 'Student', parentEmail: null, parentPhone: null };
        }
        const lead = await prismaClient_1.default.leads.findUnique({
            where: { lead_id: app.leadId },
        });
        if (!lead) {
            return { studentName: 'Student', parentEmail: null, parentPhone: null };
        }
        const studentName = lead.student_last_name
            ? `${lead.student_first_name} ${lead.student_last_name}`
            : lead.student_first_name;
        return {
            studentName,
            parentEmail: lead.contact_email,
            parentPhone: lead.contact_phone,
        };
    }
    async findCurrentByLeadId(leadId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_applications')
            .select('*')
            .eq('lead_id', leadId)
            .eq('is_current', true)
            .is('deleted_at', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async findCurrentIdsByLeadIds(leadIds) {
        if (!leadIds.length)
            return new Map();
        const { data, error } = await supabase_1.supabase
            .from('admission_applications')
            .select('id, lead_id')
            .in('lead_id', leadIds)
            .eq('is_current', true)
            .is('deleted_at', null);
        if (error)
            throw error;
        return new Map((data ?? []).map((row) => [row.lead_id, row.id]));
    }
    async findCurrentByDetails(studentName, dateOfBirth, academicYearId, schoolId) {
        const apps = await prismaClient_1.default.admissions_applications.findMany({
            where: {
                academic_year_id: academicYearId,
                ...(schoolId ? { org_id: schoolId } : {}),
            },
            include: {
                leads: true,
            },
        });
        if (!apps.length)
            return null;
        const normalizedName = studentName.trim().toLowerCase();
        for (const app of apps) {
            if (!app.leads)
                continue;
            const lead = app.leads;
            const name = (lead.student_last_name
                ? `${lead.student_first_name} ${lead.student_last_name}`
                : lead.student_first_name).toLowerCase();
            if (name === normalizedName) {
                return this.toDomain(app);
            }
        }
        return null;
    }
    async save(application) {
        const year = new Date().getFullYear();
        const appCount = await prismaClient_1.default.admissions_applications.count();
        const appNumber = application.applicationNumber ||
            `APP-${year}-${String(appCount + 1).padStart(5, '0')}`;
        const payload = {
            application_id: application.id,
            application_number: appNumber,
            org_id: application.schoolId,
            academic_year_id: application.academicYearId,
            lead_id: application.leadId,
            status: (application.status || 'submitted').toLowerCase(),
            created_by: application.createdBy,
            updated_at: application.updatedAt,
        };
        await prismaClient_1.default.admissions_applications.upsert({
            where: { application_id: application.id },
            create: payload,
            update: payload,
        });
    }
    async findTimeline(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('application_workflow')
            .select('*')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: true });
        if (error)
            return [];
        return data || [];
    }
    async findProfile(applicationId) {
        const app = await prismaClient_1.default.admissions_applications.findUnique({
            where: { application_id: applicationId },
            include: { leads: true },
        });
        if (!app || !app.leads)
            return null;
        const lead = app.leads;
        return {
            id: lead.lead_id,
            application_id: applicationId,
            date_of_birth: lead.dob,
            gender: lead.gender,
            student_first_name: lead.student_first_name,
            student_last_name: lead.student_last_name,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
        };
    }
    async saveProfile(profile) {
        if (!profile || !profile.lead_id)
            return;
        const validDob = profile.dateOfBirth && !isNaN(new Date(profile.dateOfBirth).getTime());
        const dobDate = validDob ? new Date(profile.dateOfBirth) : undefined;
        await prismaClient_1.default.leads.update({
            where: { lead_id: profile.lead_id },
            data: {
                dob: dobDate,
                gender: profile.gender ? profile.gender.toLowerCase() : undefined,
                student_first_name: profile.student_first_name || undefined,
                student_last_name: profile.student_last_name || undefined,
            },
        });
    }
    async findParents(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('application_parents')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        return data || null;
    }
    async saveParents(applicationId, parentsData) {
        const payload = {
            application_id: applicationId,
            ...parentsData,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase_1.supabase.from('application_parents').upsert(payload);
        if (error)
            throw error;
    }
    async findPreviousEducation(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('application_previous_education')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        return data || null;
    }
    async savePreviousEducation(applicationId, eduData) {
        const payload = {
            application_id: applicationId,
            ...eduData,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase_1.supabase.from('application_previous_education').upsert(payload);
        if (error)
            throw error;
    }
    async findPreferences(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('application_preferences')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        return data || null;
    }
    async savePreferences(applicationId, prefData) {
        const payload = {
            application_id: applicationId,
            ...prefData,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase_1.supabase.from('application_preferences').upsert(payload);
        if (error)
            throw error;
    }
    async findDeclaration(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('application_declarations')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            return null;
        return new ApplicationDeclaration_1.ApplicationDeclaration(data.id, data.application_id, data.agreed_to_terms, data.parent_signature, data.date_signed ? new Date(data.date_signed) : null, new Date(data.created_at), new Date(data.updated_at));
    }
    async saveDeclaration(declaration) {
        const payload = {
            id: declaration.id,
            application_id: declaration.applicationId,
            agreed_to_terms: declaration.agreedToTerms,
            parent_signature: declaration.parentSignature,
            date_signed: declaration.dateSigned
                ? declaration.dateSigned.toISOString().split('T')[0]
                : null,
            updated_at: declaration.updatedAt.toISOString(),
        };
        const { error } = await supabase_1.supabase.from('application_declarations').upsert(payload);
        if (error)
            throw error;
    }
    async logWorkflow(applicationId, action, fromStatus, toStatus, performedBy, notes) {
        try {
            const { error } = await supabase_1.supabase.from('application_workflow').insert({
                application_id: applicationId,
                action,
                from_status: fromStatus,
                to_status: toStatus,
                performed_by: performedBy,
                notes,
            });
            if (error) {
                console.warn('[logWorkflow] Warning:', error.message);
            }
        }
        catch (e) {
            console.warn('[logWorkflow] Exception:', e?.message || e);
        }
    }
    async getAgeRule(grade) {
        const { data, error } = await supabase_1.supabase
            .from('admission_age_rules')
            .select('min_age, max_age')
            .eq('grade', grade)
            .maybeSingle();
        if (error)
            throw error;
        return data || null;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
    async findByParentUser(userId, userEmail) {
        await this.linkOrphanApplicationsToParent(userId, userEmail);
        const { data: byCreator, error: creatorErr } = await supabase_1.supabase
            .from('admission_applications')
            .select('*')
            .eq('created_by', userId)
            .eq('is_current', true)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });
        if (creatorErr)
            throw creatorErr;
        const apps = new Map();
        for (const row of byCreator ?? []) {
            apps.set(row.id, this.toDomain(row));
        }
        const normalizedEmail = userEmail.trim().toLowerCase();
        if (normalizedEmail) {
            const { data: parentRows } = await supabase_1.supabase
                .from('application_parents')
                .select('application_id, father_email, mother_email, guardian_email')
                .or(`father_email.ilike.${normalizedEmail},mother_email.ilike.${normalizedEmail},guardian_email.ilike.${normalizedEmail}`);
            for (const row of parentRows ?? []) {
                if (!row.application_id || apps.has(row.application_id))
                    continue;
                const { data: appRow } = await supabase_1.supabase
                    .from('admission_applications')
                    .select('*')
                    .eq('id', row.application_id)
                    .eq('is_current', true)
                    .is('deleted_at', null)
                    .maybeSingle();
                if (appRow)
                    apps.set(appRow.id, this.toDomain(appRow));
            }
        }
        return Array.from(apps.values());
    }
    async linkOrphanApplicationsToParent(userId, userEmail) {
        const normalizedEmail = userEmail.trim().toLowerCase();
        if (!normalizedEmail)
            return;
        const leads = await prismaClient_1.default.leads.findMany({
            where: { contact_email: { equals: normalizedEmail, mode: 'insensitive' } },
            select: { lead_id: true },
        });
        for (const lead of leads) {
            await supabase_1.supabase
                .from('admissions_applications')
                .update({ created_by: userId, updated_at: new Date().toISOString() })
                .eq('lead_id', lead.lead_id)
                .is('created_by', null);
        }
        const { data: parentApps } = await supabase_1.supabase
            .from('application_parents')
            .select('application_id')
            .or(`father_email.ilike.${normalizedEmail},mother_email.ilike.${normalizedEmail},guardian_email.ilike.${normalizedEmail}`);
        for (const row of parentApps ?? []) {
            if (!row.application_id)
                continue;
            await supabase_1.supabase
                .from('admission_applications')
                .update({ created_by: userId, updated_at: new Date().toISOString() })
                .eq('id', row.application_id)
                .is('created_by', null);
        }
    }
    async isOwnedByParent(applicationId, userId, userEmail) {
        const app = await this.findById(applicationId);
        if (!app)
            return false;
        if (app.createdBy === userId)
            return true;
        const normalizedEmail = userEmail.trim().toLowerCase();
        if (!normalizedEmail)
            return false;
        const parents = await this.findParents(applicationId);
        if (parents) {
            const emails = [parents.father_email, parents.mother_email, parents.guardian_email]
                .filter(Boolean)
                .map((e) => e.toLowerCase());
            if (emails.includes(normalizedEmail))
                return true;
        }
        if (app.leadId) {
            const lead = await prismaClient_1.default.leads.findUnique({
                where: { lead_id: app.leadId },
            });
            if (lead?.contact_email?.toLowerCase() === normalizedEmail)
                return true;
        }
        return false;
    }
    async findAllPaginated(filters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = supabase_1.supabase
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
        if (error)
            throw error;
        let rows = data ?? [];
        if (filters.search) {
            const term = filters.search.toLowerCase();
            rows = rows.filter((row) => {
                const enquiry = row.lead?.enquiry;
                const studentName = enquiry?.student_name?.toLowerCase() ?? '';
                const parentEmail = enquiry?.parent_email?.toLowerCase() ?? '';
                const parentPhone = enquiry?.parent_phone?.toLowerCase() ?? '';
                return (studentName.includes(term) ||
                    parentEmail.includes(term) ||
                    parentPhone.includes(term) ||
                    row.id.includes(term));
            });
        }
        const enriched = rows.map((row) => {
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
    async findAllForStats(schoolId) {
        let query = supabase_1.supabase
            .from('admission_applications')
            .select('id, status, created_at, updated_at')
            .eq('is_current', true)
            .is('deleted_at', null);
        if (schoolId) {
            query = query.eq('school_id', schoolId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return (data ?? []).map((row) => ({
            id: row.id,
            status: (row.status ?? 'DRAFT').toLowerCase(),
            created_at: row.created_at,
            updated_at: row.updated_at,
        }));
    }
    async softDelete(id) {
        await this.performSoftDelete(id);
    }
}
exports.ApplicationRepository = ApplicationRepository;
