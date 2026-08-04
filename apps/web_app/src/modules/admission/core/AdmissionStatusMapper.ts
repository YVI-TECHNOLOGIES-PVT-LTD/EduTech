import { type LucideIcon } from 'lucide-react';
import { ADMISSION_WORKFLOW } from './admissionWorkflow';
import { AdmissionWorkflowEngine } from './AdmissionWorkflowEngine';

/** Backend state-machine statuses (uppercase) */
export type BackendAdmissionStatus =
    | 'DRAFT'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'DOCS_PENDING'
    | 'CORRECTION_REQUIRED'
    | 'DOCUMENT_VERIFIED'
    | 'EXAM'
    | 'INTERVIEW'
    | 'MERIT'
    | 'OFFERED'
    | 'FEE_PENDING'
    | 'FEE_VERIFIED'
    | 'ENROLLED';

/** Legacy REST statuses (lowercase snake) */
export type LegacyAdmissionStatus =
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'docs_verified'
    | 'payment_pending'
    | 'payment_submitted'
    | 'payment_verified'
    | 'payment_correction'
    | 'recommended'
    | 'approved'
    | 'rejected'
    | 'enrolled';

/** UI pipeline / kanban stages */
export type UIAdmissionStatus =
    | 'NEW'
    | 'REVIEW'
    | 'DOCUMENTS'
    | 'EXAM'
    | 'INTERVIEW'
    | 'MERIT'
    | 'OFFER'
    | 'FEE'
    | 'ENROLLMENT'
    | 'ENROLLED'
    | 'REJECTED';

const BACKEND_TO_LEGACY: Record<string, LegacyAdmissionStatus> = {
    DRAFT: 'draft',
    IN_PROGRESS: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    DOCS_PENDING: 'under_review',
    CORRECTION_REQUIRED: 'payment_correction',
    DOCUMENT_VERIFIED: 'docs_verified',
    EXAM: 'under_review',
    INTERVIEW: 'under_review',
    MERIT: 'recommended',
    OFFERED: 'approved',
    FEE_PENDING: 'payment_pending',
    FEE_VERIFIED: 'payment_verified',
    ENROLLED: 'enrolled',
};

const LEGACY_TO_BACKEND: Record<string, BackendAdmissionStatus> = {
    draft: 'DRAFT',
    submitted: 'SUBMITTED',
    under_review: 'UNDER_REVIEW',
    docs_verified: 'DOCUMENT_VERIFIED',
    payment_pending: 'FEE_PENDING',
    payment_submitted: 'FEE_PENDING',
    payment_verified: 'FEE_VERIFIED',
    payment_correction: 'CORRECTION_REQUIRED',
    recommended: 'MERIT',
    approved: 'OFFERED',
    rejected: 'CORRECTION_REQUIRED',
    enrolled: 'ENROLLED',
};

const LEGACY_TO_UI: Record<string, UIAdmissionStatus> = {
    draft: 'NEW',
    submitted: 'REVIEW',
    under_review: 'REVIEW',
    docs_verified: 'DOCUMENTS',
    payment_pending: 'FEE',
    payment_submitted: 'FEE',
    payment_verified: 'FEE',
    payment_correction: 'DOCUMENTS',
    recommended: 'MERIT',
    approved: 'OFFER',
    rejected: 'REJECTED',
    enrolled: 'ENROLLED',
};

const KANBAN_TO_UI: Record<string, UIAdmissionStatus> = {
    NEW: 'NEW',
    UNDER_REVIEW: 'REVIEW',
    DOCUMENT_CHECK: 'DOCUMENTS',
    ENTRANCE_EXAM: 'EXAM',
    INTERVIEW: 'INTERVIEW',
    MERIT_LIST: 'MERIT',
    OFFER_SENT: 'OFFER',
    FEES_PENDING: 'FEE',
    ENROLLED: 'ENROLLED',
};

const UI_PROGRESS_ORDER: UIAdmissionStatus[] = [
    'NEW',
    'REVIEW',
    'DOCUMENTS',
    'EXAM',
    'INTERVIEW',
    'MERIT',
    'OFFER',
    'FEE',
    'ENROLLMENT',
    'ENROLLED',
];

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-slate-100 text-slate-700',
    REVIEW: 'bg-blue-100 text-blue-700',
    DOCUMENTS: 'bg-amber-100 text-amber-700',
    EXAM: 'bg-purple-100 text-purple-700',
    INTERVIEW: 'bg-indigo-100 text-indigo-700',
    MERIT: 'bg-violet-100 text-violet-700',
    OFFER: 'bg-emerald-100 text-emerald-700',
    FEE: 'bg-orange-100 text-orange-700',
    ENROLLMENT: 'bg-cyan-100 text-cyan-700',
    ENROLLED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
};

function normalize(input: string): string {
    return input.trim();
}

export function mapBackendStatus(status: string): LegacyAdmissionStatus {
    const key = normalize(status).toUpperCase();
    return BACKEND_TO_LEGACY[key] ?? (status.toLowerCase() as LegacyAdmissionStatus);
}

export function mapLegacyStatus(status: string): BackendAdmissionStatus {
    const key = normalize(status).toLowerCase();
    return LEGACY_TO_BACKEND[key] ?? 'DRAFT';
}

export function mapUIStatus(status: string): UIAdmissionStatus {
    const raw = normalize(status);
    const upper = raw.toUpperCase();
    if (KANBAN_TO_UI[upper]) return KANBAN_TO_UI[upper];
    const legacy = raw.toLowerCase();
    if (LEGACY_TO_UI[legacy]) return LEGACY_TO_UI[legacy];
    const fromBackend = mapBackendStatus(raw);
    return LEGACY_TO_UI[fromBackend] ?? 'NEW';
}

export function getNextStatus(status: string): UIAdmissionStatus | null {
    const ui = mapUIStatus(status);
    const idx = UI_PROGRESS_ORDER.indexOf(ui);
    if (idx < 0 || idx >= UI_PROGRESS_ORDER.length - 1) return null;
    return UI_PROGRESS_ORDER[idx + 1];
}

export function getPreviousStatus(status: string): UIAdmissionStatus | null {
    const ui = mapUIStatus(status);
    const idx = UI_PROGRESS_ORDER.indexOf(ui);
    if (idx <= 0) return null;
    return UI_PROGRESS_ORDER[idx - 1];
}

export function getStatusColor(status: string): string {
    const ui = mapUIStatus(status);
    return STATUS_COLORS[ui] ?? 'bg-gray-100 text-gray-700';
}

export function getStatusIcon(status: string): LucideIcon {
    const stage = AdmissionWorkflowEngine.resolveCurrentStage(status);
    return stage.icon;
}

export function getProgressPercentage(status: string): number {
    return AdmissionWorkflowEngine.calculateProgress(status);
}

export function formatStatusLabel(status: string): string {
    const stage = AdmissionWorkflowEngine.resolveCurrentStage(status);
    return stage.displayName;
}

/** Canonical pipeline / kanban columns — single source of truth */
export const PIPELINE_COLUMNS: { id: UIAdmissionStatus; title: string }[] = [
    { id: 'NEW', title: 'New Applications' },
    { id: 'REVIEW', title: 'Under Review' },
    { id: 'DOCUMENTS', title: 'Document Verification' },
    { id: 'EXAM', title: 'Entrance Exam' },
    { id: 'INTERVIEW', title: 'Interview Panel' },
    { id: 'MERIT', title: 'Merit List' },
    { id: 'OFFER', title: 'Offer Sent' },
    { id: 'FEE', title: 'Fee Verification' },
    { id: 'ENROLLMENT', title: 'Enrollment Processing' },
    { id: 'ENROLLED', title: 'Enrolled' },
];

export function getPipelineColumnId(status: string): UIAdmissionStatus {
    return mapUIStatus(status);
}

export function canPipelineTransition(fromLegacyStatus: string, targetColumn: UIAdmissionStatus): boolean {
    return resolvePipelineWorkflowAction(fromLegacyStatus, targetColumn) !== null;
}

/** Maps a kanban column drop to the legacy workflow API action */
export function resolvePipelineWorkflowAction(
    legacyStatus: string,
    targetColumn: UIAdmissionStatus,
): 'review' | 'verify' | 'initiate_payment' | 'verify_fee' | 'recommend' | 'approve' | 'enrol' | 'reject' | null {
    const current = mapUIStatus(legacyStatus);
    const currentIdx = UI_PROGRESS_ORDER.indexOf(current);
    const targetIdx = UI_PROGRESS_ORDER.indexOf(targetColumn);

    if (targetIdx <= currentIdx) return null;
    if (targetColumn === 'REJECTED') return 'reject';

    const s = legacyStatus.toLowerCase();

    if (targetColumn === 'REVIEW' && s === 'submitted') return 'review';
    if (targetColumn === 'DOCUMENTS' && (s === 'under_review' || s === 'submitted')) return 'verify';
    if (targetColumn === 'FEE' && s === 'docs_verified') return 'initiate_payment';
    if (targetColumn === 'MERIT' && s === 'payment_submitted') return 'verify_fee';
    if (targetColumn === 'MERIT' && (s === 'payment_verified' || s === 'payment_pending')) return 'recommend';
    if (targetColumn === 'OFFER' && s === 'recommended') return 'approve';
    if (targetColumn === 'ENROLLED' && s === 'approved') return 'enrol';
    if (targetColumn === 'ENROLLED' && s === 'enrolled') return null;

    return null;
}

export function computeApplicationSla(legacyStatus: string, submittedAt?: string, createdAt?: string): {
    progress: number;
    status: 'normal' | 'warning' | 'breached';
    remainingHours: number;
    totalHours: number;
} {
    const sla = AdmissionWorkflowEngine.calculateSLA(createdAt ?? new Date().toISOString(), legacyStatus, submittedAt);
    const progress = AdmissionWorkflowEngine.calculateProgress(legacyStatus);
    
    let mappedStatus: 'normal' | 'warning' | 'breached' = 'normal';
    if (sla.status === 'breached') mappedStatus = 'breached';
    else if (sla.status === 'critical' || sla.status === 'warning') mappedStatus = 'warning';

    return {
        progress,
        status: mappedStatus,
        remainingHours: sla.remainingHours,
        totalHours: sla.totalHours,
    };
}
