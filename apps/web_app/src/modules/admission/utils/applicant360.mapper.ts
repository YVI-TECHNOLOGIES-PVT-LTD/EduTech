import type { Admission, AdmissionTimelineEntry } from '../types/admission.types';
import type { TimelineNode } from '../components/timeline/TimelineEngine';
import { mapUIStatus, getProgressPercentage, formatStatusLabel } from '../core/AdmissionStatusMapper';
import { calculateLeadScore } from './lead.score';
import type { LeadScoreTier } from '../types/admission.types';

export interface Applicant360View {
    id: string;
    code: string;
    name: string;
    email: string;
    phone: string;
    grade: string;
    status: string;
    uiStatus: string;
    submittedAt: string;
    counselor?: string;
    candidateScore?: number;
    slaRemainingHours: number;
    slaTotalHours: number;
    documentChecklist: { name: string; verified: boolean }[];
    crmLeadTemp: LeadScoreTier;
    crmLeadScore: number;
    examStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'EXEMPTED';
    examScore?: number;
    interviewStatus: 'PENDING' | 'RECOMMENDED' | 'REJECTED';
    feeStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    auditLogs: AdmissionTimelineEntry[];
    timelineNodes: TimelineNode[];
    progressPercent: number;
    paymentAmount?: number;
    paymentReference?: string;
    enrollmentStatus?: string;
}

const WORKFLOW_STAGES: { id: string; stage: string; role: string; slaHours: number; afterStatus: string[] }[] = [
    { id: 'submitted', stage: 'Application Submitted', role: 'Parent', slaHours: 24, afterStatus: ['submitted', 'under_review', 'docs_verified', 'payment_pending', 'payment_submitted', 'payment_verified', 'recommended', 'approved', 'enrolled'] },
    { id: 'review', stage: 'Officer Review', role: 'Admission Officer', slaHours: 48, afterStatus: ['under_review', 'docs_verified', 'payment_pending', 'payment_submitted', 'payment_verified', 'recommended', 'approved', 'enrolled'] },
    { id: 'docs', stage: 'Document Verification', role: 'Admission Officer', slaHours: 24, afterStatus: ['docs_verified', 'payment_pending', 'payment_submitted', 'payment_verified', 'recommended', 'approved', 'enrolled'] },
    { id: 'payment', stage: 'Fee Collection', role: 'Finance', slaHours: 72, afterStatus: ['payment_verified', 'recommended', 'approved', 'enrolled'] },
    { id: 'recommend', stage: 'Recommendation', role: 'Admission Officer', slaHours: 24, afterStatus: ['recommended', 'approved', 'enrolled'] },
    { id: 'approve', stage: 'Principal Approval', role: 'Principal', slaHours: 24, afterStatus: ['approved', 'enrolled'] },
    { id: 'enrol', stage: 'Enrollment', role: 'Admission Officer', slaHours: 48, afterStatus: ['enrolled'] },
];

function statusIndex(status: string): number {
    const order = ['draft', 'submitted', 'under_review', 'docs_verified', 'payment_pending', 'payment_submitted', 'payment_correction', 'payment_verified', 'recommended', 'approved', 'rejected', 'enrolled'];
    const idx = order.indexOf(status.toLowerCase());
    return idx >= 0 ? idx : 0;
}

function buildTimelineNodes(app: Admission, auditLogs: AdmissionTimelineEntry[]): TimelineNode[] {
    const current = app.status.toLowerCase();
    const isRejected = current === 'rejected';
    const currentIdx = statusIndex(current);

    return WORKFLOW_STAGES.map((stage, stageIdx) => {
        const stageThreshold = statusIndex(stage.afterStatus[0] ?? 'submitted');
        let nodeStatus: TimelineNode['status'] = 'upcoming';

        if (isRejected) {
            nodeStatus = stageIdx === 1 ? 'breached' : stageIdx < 1 ? 'complete' : 'upcoming';
        } else if (current === 'enrolled' || currentIdx >= statusIndex(stage.afterStatus[stage.afterStatus.length - 1] ?? '')) {
            nodeStatus = 'complete';
        } else if (currentIdx >= stageThreshold) {
            nodeStatus = 'complete';
        } else if (stageIdx === 0 || currentIdx >= statusIndex(WORKFLOW_STAGES[stageIdx - 1]?.afterStatus[0] ?? 'draft')) {
            nodeStatus = 'current';
        }

        const matchingLog = auditLogs.find(l =>
            l.action.toLowerCase().includes(stage.stage.split(' ')[0].toLowerCase()),
        );

        return {
            id: stage.id,
            stage: stage.stage,
            role: stage.role,
            operator: matchingLog?.actor ?? matchingLog?.operator_name ?? '—',
            timestamp: matchingLog?.timestamp
                ? new Date(matchingLog.timestamp).toLocaleString()
                : undefined,
            slaHours: stage.slaHours,
            remarks: matchingLog?.remarks,
            status: nodeStatus,
        };
    });
}

function mapDocumentChecklist(app: Admission, auditLogs: AdmissionTimelineEntry[]) {
    const docs = app.admission_documents ?? [];
    const docsVerified = statusIndex(app.status) >= statusIndex('docs_verified');
    const verifyActions = auditLogs.filter(l => l.action.toLowerCase().includes('doc') || l.action.toLowerCase().includes('verify'));

    if (docs.length === 0) {
        return [{ name: 'No documents uploaded', verified: false }];
    }

    return docs.map(doc => {
        const typeLabel = doc.document_type.replace(/_/g, ' ');
        const verified =
            docsVerified ||
            verifyActions.some(a => a.remarks?.toLowerCase().includes(doc.document_type.toLowerCase()) ?? false);
        return { name: typeLabel, verified };
    });
}

function computeSla(app: Admission): { remaining: number; total: number } {
    const total = 24;
    const anchor = app.submitted_at ?? app.created_at;
    if (!anchor) return { remaining: total, total };

    const deadline = new Date(anchor).getTime() + total * 3600000;
    const remaining = Math.max(0, Math.round((deadline - Date.now()) / 3600000));
    return { remaining, total };
}

function mapExamStatus(data: unknown, app: Admission): { status: Applicant360View['examStatus']; score?: number } {
    if (!data) {
        if (['recommended', 'approved', 'enrolled', 'docs_verified'].includes(app.status)) {
            return { status: 'EXEMPTED' };
        }
        return { status: 'PENDING' };
    }

    const obj = data as Record<string, unknown>;
    const results = (obj.results ?? obj.data ?? data) as Record<string, unknown> | Record<string, unknown>[];
    const row = Array.isArray(results) ? results[0] : results;
    if (!row) return { status: 'PENDING' };

    const score = Number(row.total_score ?? row.score ?? row.percentage ?? 0) || undefined;
    const passed = row.passed ?? row.status ?? row.result;
    if (passed === true || passed === 'PASSED' || passed === 'pass') return { status: 'PASSED', score };
    if (passed === false || passed === 'FAILED' || passed === 'fail') return { status: 'FAILED', score };
    if (score !== undefined && score >= 40) return { status: 'PASSED', score };
    return { status: 'PENDING', score };
}

function mapInterviewStatus(app: Admission, meritData: unknown): Applicant360View['interviewStatus'] {
    if (app.status === 'rejected') return 'REJECTED';
    if (['recommended', 'approved', 'enrolled'].includes(app.status)) return 'RECOMMENDED';
    if (meritData) {
        const obj = meritData as Record<string, unknown>;
        const rank = obj.rank ?? obj.merit_rank;
        if (rank) return 'RECOMMENDED';
    }
    return 'PENDING';
}

function mapFeeStatus(app: Admission): Applicant360View['feeStatus'] {
    if (app.payment_verified || app.status === 'payment_verified') return 'VERIFIED';
    if (app.status === 'payment_correction') return 'FAILED';
    if (app.payment_enabled || app.status === 'payment_pending' || app.status === 'payment_submitted') return 'PENDING';
    return 'PENDING';
}

function formatSubmittedAt(app: Admission): string {
    const raw = app.submitted_at ?? app.created_at;
    return raw ? new Date(raw).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

export interface Applicant360MapperInput {
    application: Admission;
    auditLogs: AdmissionTimelineEntry[];
    examResults?: unknown;
    meritData?: unknown;
    feesSummary?: Record<string, unknown> | null;
    enrollmentStatus?: unknown;
}

export function mapApplicant360View(input: Applicant360MapperInput): Applicant360View {
    const { application: app, auditLogs, examResults, meritData, feesSummary, enrollmentStatus } = input;
    const uiStatus = mapUIStatus(app.status);
    const progressPercent = getProgressPercentage(app.status);
    const sla = computeSla(app);
    const exam = mapExamStatus(examResults, app);
    const leadScore = calculateLeadScore(
        {
            id: app.id,
            student_name: app.student_name,
            parent_name: app.parent_name,
            parent_email: app.parent_email,
            parent_phone: app.parent_phone,
            grade_applied_for: app.grade_applied_for,
            status: app.status,
            created_at: app.created_at,
            updated_at: app.updated_at,
            document_count: app.admission_documents?.length ?? 0,
        },
        [],
    );

    const enrollmentObj = enrollmentStatus as Record<string, unknown> | null | undefined;

    return {
        id: app.id,
        code: app.id.slice(0, 8).toUpperCase(),
        name: app.student_name,
        email: app.parent_email ?? app.applicant?.email ?? '—',
        phone: app.parent_phone ?? '—',
        grade: app.grade_applied_for,
        status: formatStatusLabel(app.status),
        uiStatus,
        submittedAt: formatSubmittedAt(app),
        counselor: app.remark_by_officer ? 'Admission Officer' : undefined,
        candidateScore: progressPercent,
        slaRemainingHours: sla.remaining,
        slaTotalHours: sla.total,
        documentChecklist: mapDocumentChecklist(app, auditLogs),
        crmLeadTemp: leadScore.tier,
        crmLeadScore: leadScore.score,
        examStatus: exam.status,
        examScore: exam.score,
        interviewStatus: mapInterviewStatus(app, meritData),
        feeStatus: mapFeeStatus(app),
        auditLogs,
        timelineNodes: buildTimelineNodes(app, auditLogs),
        progressPercent,
        paymentAmount: app.payment_amount ?? (feesSummary?.total as number | undefined),
        paymentReference: app.payment_reference,
        enrollmentStatus: enrollmentObj?.status ? String(enrollmentObj.status) : app.status === 'enrolled' ? 'completed' : undefined,
    };
}
