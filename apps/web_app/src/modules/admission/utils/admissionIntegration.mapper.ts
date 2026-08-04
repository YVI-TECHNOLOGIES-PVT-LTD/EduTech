import type { Admission } from '../types/admission.types';
import { formatStatusLabel, mapUIStatus } from '../core/AdmissionStatusMapper';

export interface AdmissionReportRow {
    id: string;
    code: string;
    name: string;
    grade: string;
    score: string;
    status: string;
    updatedAt: string;
}

export interface ExecutiveKpiTile {
    title: string;
    value: string;
    change: string;
}

export interface FunnelStageRow {
    stage: string;
    count: number;
    percentage: number;
}

const FUNNEL_STAGE_LABELS: Record<string, string> = {
    NEW: 'Inquiries / New',
    REVIEW: 'Under Review',
    EXAM: 'Entrance Exam',
    INTERVIEW: 'Interview',
    MERIT: 'Merit Selection',
    OFFER: 'Offer Extended',
    FEE: 'Fee Collection',
    ENROLLMENT: 'Enrollment',
};

export function mapApplicationToReportRow(app: Admission): AdmissionReportRow {
    return {
        id: app.id,
        code: app.id.slice(0, 8).toUpperCase(),
        name: app.student_name,
        grade: app.grade_applied_for ?? '—',
        score: '—',
        status: formatStatusLabel(app.status),
        updatedAt: app.updated_at
            ? new Date(app.updated_at).toLocaleString()
            : app.created_at
              ? new Date(app.created_at).toLocaleString()
              : '—',
    };
}

export function mapApplicationsToReportRows(apps: Admission[]): AdmissionReportRow[] {
    return apps.map(mapApplicationToReportRow);
}

export function mapStatsToExecutiveKpis(stats: Record<string, unknown> | null | undefined): ExecutiveKpiTile[] {
    const total = Number(stats?.totalApplications ?? stats?.total ?? 0);
    const pending = Number(stats?.totalPending ?? stats?.pending ?? 0);
    const verifiedToday = Number(stats?.verifiedToday ?? 0);
    const conversionRate = Number(stats?.conversionRate ?? 0);

    return [
        {
            title: 'Total Applications',
            value: String(total),
            change: `${pending} pending review`,
        },
        {
            title: 'Verified Today',
            value: String(verifiedToday),
            change: 'Document / workflow actions',
        },
        {
            title: 'Conversion Rate',
            value: `${conversionRate}%`,
            change: 'Inquiry to enrollment',
        },
        {
            title: 'Active Pipeline',
            value: String(Math.max(total - Number(stats?.enrolled ?? 0), 0)),
            change: 'Non-enrolled applications',
        },
    ];
}

export function buildFunnelFromApplications(apps: Admission[]): FunnelStageRow[] {
    const stages = ['NEW', 'REVIEW', 'EXAM', 'INTERVIEW', 'MERIT', 'OFFER', 'FEE', 'ENROLLMENT'] as const;
    const counts = stages.map(stage => ({
        stage: FUNNEL_STAGE_LABELS[stage] ?? stage,
        count: apps.filter(a => mapUIStatus(a.status) === stage).length,
    }));
    const base = counts[0]?.count || apps.length || 1;
    return counts.map((row, idx) => ({
        ...row,
        percentage: idx === 0 ? 100 : Math.round((row.count / base) * 100),
    }));
}

export function mapApplicationsToActionItems(
    apps: Admission[],
    titleFn: (app: Admission) => string,
    limit = 6,
) {
    return apps.slice(0, limit).map(app => ({
        id: app.id,
        title: titleFn(app),
        description: `${app.id.slice(0, 8).toUpperCase()} · ${app.grade_applied_for ?? '—'}`,
        status: app.status === 'recommended' || app.status === 'approved' ? ('urgent' as const) : ('pending' as const),
        time: app.updated_at ? new Date(app.updated_at).toLocaleDateString() : '—',
    }));
}

export function mapOfferApprovalQueue(apps: Admission[]) {
    return apps.slice(0, 8).map(app => ({
        applicationId: app.id,
        name: app.student_name,
        code: app.id.slice(0, 8).toUpperCase(),
        grade: app.grade_applied_for ?? '—',
        status: formatStatusLabel(app.status),
    }));
}
