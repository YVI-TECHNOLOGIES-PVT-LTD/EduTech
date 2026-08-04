import type { Admission, AdmissionApplication } from '../types';
import { mapUIStatus, getProgressPercentage } from '../core/AdmissionStatusMapper';

function mapCrmStatus(status?: string): Admission['status'] {
    const normalized = (status ?? 'DRAFT').toLowerCase();
    if (normalized === 'draft') return 'draft';
    if (normalized === 'submitted') return 'submitted';
    if (normalized === 'under_review') return 'under_review';
    return normalized as Admission['status'];
}

export function mapCrmApplicationResponse(raw: unknown): Admission {
    const payload = raw as Record<string, any>;
    const app = payload.application ?? payload;
    const profile = payload.profile ?? {};
    const parents = payload.parents ?? {};
    const enquiry = payload.enquiry ?? {};

    const appId = app.id ?? app.applicationId;
    const status = mapCrmStatus(app.status);

    return {
        id: String(appId),
        school_id: String(app.school_id ?? app.schoolId ?? enquiry?.school_id ?? ''),
        academic_year_id: String(app.academic_year_id ?? app.academicYearId ?? enquiry?.academic_year_id ?? ''),
        applicant_user_id: String(app.created_by ?? app.createdBy ?? ''),
        student_name: String(enquiry?.student_name ?? enquiry?.studentName ?? 'Applicant'),
        date_of_birth: String(profile.date_of_birth ?? profile.dateOfBirth ?? enquiry?.date_of_birth ?? ''),
        gender: (profile.gender ?? enquiry?.gender ?? 'Other') as Admission['gender'],
        grade_applied_for: String(enquiry?.grade_applied_for ?? enquiry?.gradeAppliedFor ?? 'Grade 1'),
        parent_name: String(
            enquiry?.parent_name ??
            enquiry?.parentName ??
            parents.guardian_name ??
            parents.guardianName ??
            ''
        ),
        parent_email: String(
            enquiry?.parent_email ??
            enquiry?.parentEmail ??
            parents.guardian_email ??
            parents.guardianEmail ??
            ''
        ),
        parent_phone: String(
            enquiry?.parent_phone ??
            enquiry?.parentPhone ??
            parents.guardian_phone ??
            parents.guardianPhone ??
            ''
        ),
        status,
        submitted_at: app.submitted_at ?? app.submittedAt,
        created_at: String(app.created_at ?? app.createdAt ?? new Date().toISOString()),
        updated_at: String(app.updated_at ?? app.updatedAt ?? new Date().toISOString()),
        admission_documents: [],
        admission_audit_logs: [],
    };
}

export function mapApplication(raw: Admission): AdmissionApplication {
    return {
        ...raw,
        uiStatus: mapUIStatus(raw.status),
        progressPercent: getProgressPercentage(raw.status),
    };
}

export function mapApplicationList(raw: unknown): Admission[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as Admission[];
    const obj = raw as { data?: Admission[]; admissions?: Admission[] };
    return obj.data ?? obj.admissions ?? [];
}

export function mapApplicationDetail(raw: unknown): Admission | null {
    if (!raw) return null;
    return raw as Admission;
}
