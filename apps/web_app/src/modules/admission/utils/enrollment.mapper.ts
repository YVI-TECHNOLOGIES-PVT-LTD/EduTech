import type { Admission, AdmissionAuditLog } from '../types/admission.types';

export type ProvisioningStepStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type EnrollmentPhase = 'awaiting_confirmation' | 'ready_to_enroll' | 'enrolled' | 'failed';

export interface ProvisioningStep {
    key: string;
    backendStep: string;
    label: string;
    status: ProvisioningStepStatus;
    errorMessage?: string;
}

export interface EnrollmentValidationItem {
    key: string;
    label: string;
    passed: boolean;
    detail?: string;
}

export interface EnrollmentQueueItem {
    applicationId: string;
    studentName: string;
    program?: string;
    status: string;
    phase: EnrollmentPhase;
    admissionNumber?: string;
    hasConfirmation: boolean;
    isEnrolled: boolean;
}

export interface EnrollmentRecord {
    applicationId: string;
    candidate: string;
    applicationNo: string;
    program: string;
    phase: EnrollmentPhase;
    admissionNumber?: string;
    studentId?: string;
    confirmedAt?: string;
    enrolledAt?: string;
    validation: EnrollmentValidationItem[];
    provisioningSteps: ProvisioningStep[];
}

export interface EnrollmentSummaryStats {
    total: number;
    awaitingConfirmation: number;
    readyToEnroll: number;
    enrolled: number;
    failed: number;
}

export interface EnrollmentHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
}

export interface EnrollmentAuditEntry extends EnrollmentHistoryEntry {
    entityId?: string;
}

/** Backend provisioner step names → UI labels */
export const PROVISIONING_STEP_DEFS: { backendStep: string; key: string; label: string }[] = [
    { backendStep: 'Student', key: 'student_master', label: 'Student Master Record' },
    { backendStep: 'Academic', key: 'academic_allocation', label: 'Academic Roll & Section' },
    { backendStep: 'Parent', key: 'guardian', label: 'Guardian Mapping' },
    { backendStep: 'User', key: 'identity', label: 'Student Login & Identity' },
    { backendStep: 'Transport', key: 'transport', label: 'Transport Route Allocation' },
    { backendStep: 'Hostel', key: 'hostel', label: 'Hostel Room Assignment' },
    { backendStep: 'Library', key: 'library', label: 'Library Access Card' },
    { backendStep: 'IDCard', key: 'id_card', label: 'Identity / ID Card' },
];

const ENROLLMENT_ACTIONS = new Set([
    'STUDENT_ENROLLED',
    'ADMISSION_CONFIRMED',
    'ENROLLMENT',
    'PROVISION',
    'GUARDIAN',
    'ACADEMIC',
    'TRANSPORT',
    'HOSTEL',
    'LIBRARY',
    'ID_CARD',
]);

export function parseConfirmationFromRaw(raw: unknown): {
    admissionNumber?: string;
    studentId?: string;
    confirmedAt?: string;
} | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    return {
        admissionNumber: (obj.admissionNumber ?? obj.admission_number) as string | undefined,
        studentId: (obj.studentId ?? obj.student_id) as string | undefined,
        confirmedAt: (obj.confirmedAt ?? obj.confirmed_at) as string | undefined,
    };
}

export function resolveEnrollmentPhase(
    app: Admission,
    confirmation: ReturnType<typeof parseConfirmationFromRaw>,
): EnrollmentPhase {
    if (app.status === 'enrolled' || confirmation?.studentId) return 'enrolled';
    const failed = app.admission_audit_logs?.some(
        l =>
            l.action.includes('FAILED') ||
            (l.action.includes('ENROLL') && l.remarks?.toLowerCase().includes('fail')),
    );
    if (failed) return 'failed';
    if (confirmation?.admissionNumber) return 'ready_to_enroll';
    return 'awaiting_confirmation';
}

export function mapValidationChecklist(
    app: Admission,
    confirmation: ReturnType<typeof parseConfirmationFromRaw>,
    feesSummary?: Record<string, unknown> | null,
): EnrollmentValidationItem[] {
    const outstanding = feesSummary?.totalOutstandingAmount as number | undefined;
    const paymentOk =
        app.payment_verified === true ||
        app.status === 'payment_verified' ||
        app.status === 'approved' ||
        outstanding === 0;

    return [
        {
            key: 'offer',
            label: 'Offer Accepted',
            passed: ['approved', 'payment_verified', 'payment_pending', 'payment_submitted', 'enrolled'].includes(
                app.status,
            ),
            detail: app.status,
        },
        {
            key: 'payment',
            label: 'Payment Verified',
            passed: paymentOk,
            detail: outstanding !== undefined ? `Outstanding: ₹${outstanding}` : undefined,
        },
        {
            key: 'documents',
            label: 'Documents Verified',
            passed:
                (app.admission_audit_logs?.some(l => l.action.toLowerCase().includes('document')) ?? false) ||
                ['approved', 'payment_verified', 'enrolled'].includes(app.status),
        },
        {
            key: 'confirmation',
            label: 'Admission Confirmed',
            passed: !!confirmation?.admissionNumber,
            detail: confirmation?.admissionNumber,
        },
        {
            key: 'fee_activation',
            label: 'Fee Ledger Active',
            passed: !!feesSummary || app.payment_enabled === true,
            detail: feesSummary ? 'Fee structure assigned' : undefined,
        },
    ];
}

export function mapProvisioningSteps(
    app: Admission,
    confirmation: ReturnType<typeof parseConfirmationFromRaw>,
    phase: EnrollmentPhase,
): ProvisioningStep[] {
    const enrolled = phase === 'enrolled';
    const failedLogs = (app.admission_audit_logs ?? []).filter(
        l => l.action.includes('FAILED') || l.remarks?.toLowerCase().includes('fail'),
    );

    return PROVISIONING_STEP_DEFS.map(def => {
        let status: ProvisioningStepStatus = 'PENDING';
        let errorMessage: string | undefined;

        if (enrolled) {
            status = 'COMPLETED';
        } else if (phase === 'failed') {
            const related = failedLogs.find(
                l =>
                    l.action.toLowerCase().includes(def.backendStep.toLowerCase()) ||
                    l.remarks?.toLowerCase().includes(def.key),
            );
            status = related ? 'FAILED' : 'PENDING';
            errorMessage = related?.remarks;
        } else if (confirmation?.admissionNumber && phase === 'ready_to_enroll') {
            status = 'PENDING';
        }

        return {
            key: def.key,
            backendStep: def.backendStep,
            label: def.label,
            status,
            errorMessage,
        };
    });
}

export function mapEnrollmentRecord(
    app: Admission,
    enrollmentStatus?: unknown,
    feesSummary?: Record<string, unknown> | null,
): EnrollmentRecord {
    const confirmation = parseConfirmationFromRaw(enrollmentStatus);
    const phase = resolveEnrollmentPhase(app, confirmation);
    const enrolledLog = app.admission_audit_logs?.find(l => l.action === 'STUDENT_ENROLLED');

    return {
        applicationId: app.id,
        candidate: app.student_name,
        applicationNo: app.id.slice(0, 8).toUpperCase(),
        program: app.grade_applied_for ?? '—',
        phase,
        admissionNumber: confirmation?.admissionNumber,
        studentId: confirmation?.studentId,
        confirmedAt: confirmation?.confirmedAt,
        enrolledAt: enrolledLog?.created_at,
        validation: mapValidationChecklist(app, confirmation, feesSummary),
        provisioningSteps: mapProvisioningSteps(app, confirmation, phase),
    };
}

export function mapEnrollmentQueueItem(app: Admission): EnrollmentQueueItem {
    const hasConfirmLog =
        app.admission_audit_logs?.some(
            l => l.action.includes('CONFIRM') || l.action === 'ADMISSION_CONFIRMED',
        ) ?? false;
    const phase: EnrollmentPhase =
        app.status === 'enrolled'
            ? 'enrolled'
            : hasConfirmLog || app.status === 'approved'
              ? 'ready_to_enroll'
              : 'awaiting_confirmation';

    return {
        applicationId: app.id,
        studentName: app.student_name,
        program: app.grade_applied_for,
        status: app.status,
        phase,
        hasConfirmation: hasConfirmLog,
        isEnrolled: app.status === 'enrolled',
    };
}

export function mapEnrollmentQueueItemWithStatus(
    app: Admission,
    enrollmentStatus?: unknown,
): EnrollmentQueueItem {
    const confirmation = parseConfirmationFromRaw(enrollmentStatus);
    const phase = resolveEnrollmentPhase(app, confirmation);
    return {
        applicationId: app.id,
        studentName: app.student_name,
        program: app.grade_applied_for,
        status: app.status,
        phase,
        admissionNumber: confirmation?.admissionNumber,
        hasConfirmation: !!confirmation?.admissionNumber,
        isEnrolled: phase === 'enrolled',
    };
}

export function filterEnrollmentQueue(
    items: EnrollmentQueueItem[],
    search: string,
    statusFilter: string,
): EnrollmentQueueItem[] {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
        if (statusFilter !== 'all' && item.phase !== statusFilter) return false;
        if (!q) return true;
        return (
            item.studentName.toLowerCase().includes(q) ||
            item.applicationId.toLowerCase().includes(q) ||
            (item.program ?? '').toLowerCase().includes(q)
        );
    });
}

export function summarizeEnrollmentRecords(records: EnrollmentRecord[]): EnrollmentSummaryStats {
    return records.reduce(
        (acc, r) => {
            acc.total += 1;
            if (r.phase === 'awaiting_confirmation') acc.awaitingConfirmation += 1;
            else if (r.phase === 'ready_to_enroll') acc.readyToEnroll += 1;
            else if (r.phase === 'enrolled') acc.enrolled += 1;
            else if (r.phase === 'failed') acc.failed += 1;
            return acc;
        },
        { total: 0, awaitingConfirmation: 0, readyToEnroll: 0, enrolled: 0, failed: 0 },
    );
}

export function mapEnrollmentHistory(logs?: AdmissionAuditLog[]): EnrollmentHistoryEntry[] {
    return (logs ?? [])
        .filter(l => ENROLLMENT_ACTIONS.has(l.action) || l.action.toLowerCase().includes('enroll'))
        .map(l => ({
            id: l.id,
            action: l.action,
            actor: l.performed_by ?? undefined,
            remarks: l.remarks ?? undefined,
            timestamp: l.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function mapEnrollmentAudit(logs?: AdmissionAuditLog[]): EnrollmentAuditEntry[] {
    return mapEnrollmentHistory(logs).map(e => ({ ...e, entityId: e.id }));
}

export function enrollmentRecordToExportRow(record: EnrollmentRecord): Record<string, string> {
    return {
        Candidate: record.candidate,
        'Application No': record.applicationNo,
        Program: record.program,
        Phase: record.phase,
        'Admission Number': record.admissionNumber ?? '—',
        'Student ID': record.studentId ?? '—',
    };
}

export function getProvisioningStep(
    steps: ProvisioningStep[],
    key: string,
): ProvisioningStep | undefined {
    return steps.find(s => s.key === key);
}
