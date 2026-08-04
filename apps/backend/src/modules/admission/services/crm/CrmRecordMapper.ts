import { AdmissionEnquiry } from '../../domain/AdmissionEnquiry';
import { AdmissionLead } from '../../domain/AdmissionLead';
import { supabase } from '../../../../config/supabase';

export type AssignmentHistory = { assignedBy: string | null; assignedAt: string | null };

/** Latest counselor assignment from status_history (LeadCounselorAssigned). */
export async function resolveAssignmentHistory(leadIds: string[]): Promise<Map<string, AssignmentHistory>> {
    const uniqueIds = [...new Set(leadIds.filter(Boolean))];
    const result = new Map<string, AssignmentHistory>();
    if (!uniqueIds.length) return result;

    const { data: rows } = await supabase
        .from('status_history')
        .select('entity_id, changed_by, created_at')
        .eq('entity_name', 'admission_leads')
        .eq('event_name', 'LeadCounselorAssigned')
        .in('entity_id', uniqueIds)
        .order('created_at', { ascending: false });

    if (!rows?.length) return result;

    const userIds = [...new Set(rows.map(r => r.changed_by).filter(Boolean))] as string[];
    const userNames = userIds.length ? await resolveCounselorNames(userIds) : new Map<string, string>();

    for (const row of rows) {
        if (result.has(row.entity_id)) continue;
        result.set(row.entity_id, {
            assignedBy: row.changed_by ? (userNames.get(row.changed_by) ?? 'Admissions Desk') : 'Admissions Desk',
            assignedAt: row.created_at,
        });
    }

    const missingIds = uniqueIds.filter(id => !result.has(id));
    if (missingIds.length) {
        const { data: auditRows } = await supabase
            .from('audit_logs')
            .select('entity_id, user_id, created_at')
            .eq('entity_name', 'admission_leads')
            .eq('action', 'ASSIGN_COUNSELOR')
            .in('entity_id', missingIds)
            .order('created_at', { ascending: false });

        const auditUserIds = [...new Set((auditRows ?? []).map(r => r.user_id).filter(Boolean))] as string[];
        const auditUserNames = auditUserIds.length ? await resolveCounselorNames(auditUserIds) : new Map<string, string>();

        for (const row of auditRows ?? []) {
            if (result.has(row.entity_id)) continue;
            result.set(row.entity_id, {
                assignedBy: row.user_id ? (auditUserNames.get(row.user_id) ?? 'Admissions Desk') : 'Admissions Desk',
                assignedAt: row.created_at,
            });
        }
    }

    return result;
}

export async function mapEnquiryToApiRecord(
    enquiry: AdmissionEnquiry,
    lead?: AdmissionLead | null,
    applicationId?: string | null,
    counselorName?: string | null,
    assignment?: AssignmentHistory | null
): Promise<Record<string, unknown>> {
    return {
        id: enquiry.id,
        enquiry_id: enquiry.id,
        lead_id: lead?.id ?? null,
        school_id: enquiry.schoolId,
        academic_year_id: enquiry.academicYearId,
        student_name: enquiry.studentName,
        parent_name: enquiry.parentName,
        parent_email: enquiry.parentEmail,
        parent_phone: enquiry.parentPhone,
        email: enquiry.parentEmail,
        phone: enquiry.parentPhone,
        grade_applied_for: enquiry.gradeAppliedFor,
        source: enquiry.source,
        status: applicationId ? 'application_created' : enquiry.status,
        date_of_birth: enquiry.dateOfBirth?.toISOString().split('T')[0] ?? null,
        gender: enquiry.gender,
        created_at: enquiry.createdAt.toISOString(),
        updated_at: enquiry.updatedAt.toISOString(),
        assigned_counselor_id: lead?.counselorId ?? null,
        assigned_counselor: counselorName ?? null,
        assigned_at: assignment?.assignedAt ?? (lead?.counselorId ? lead.updatedAt.toISOString() : null),
        assigned_by: assignment?.assignedBy ?? null,
        application_id: applicationId ?? null,
    };
}

export async function mapLeadToApiRecord(
    lead: AdmissionLead,
    enquiry?: AdmissionEnquiry | null,
    applicationId?: string | null,
    counselorName?: string | null,
    assignment?: AssignmentHistory | null
): Promise<Record<string, unknown>> {
    if (enquiry) {
        const base = await mapEnquiryToApiRecord(enquiry, lead, applicationId, counselorName, assignment);
        return {
            ...base,
            id: lead.id,
            enquiry_id: enquiry.id,
            lead_id: lead.id,
            status: applicationId ? 'application_created' : lead.status,
        };
    }

    return {
        id: lead.id,
        enquiry_id: lead.enquiryId,
        lead_id: lead.id,
        status: applicationId ? 'application_created' : lead.status,
        assigned_counselor_id: lead.counselorId,
        assigned_counselor: counselorName ?? null,
        assigned_at: assignment?.assignedAt ?? (lead.counselorId ? lead.updatedAt.toISOString() : null),
        assigned_by: assignment?.assignedBy ?? null,
        application_id: applicationId ?? null,
        created_at: lead.createdAt.toISOString(),
        updated_at: lead.updatedAt.toISOString(),
    };
}

export async function resolveCounselorNames(counselorIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(counselorIds.filter(Boolean))];
    if (!uniqueIds.length) return new Map();

    const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', uniqueIds);

    return new Map((data ?? []).map(row => [row.id, row.full_name]));
}
