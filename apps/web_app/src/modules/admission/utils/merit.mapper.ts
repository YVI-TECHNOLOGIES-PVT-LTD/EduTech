import type { Admission, AdmissionAuditLog } from '../types/admission.types';

export type MeritSeatStatus = 'SELECTED' | 'WAITLISTED' | 'RESERVED' | 'REJECTED' | 'PENDING';
export type MeritRecordStatus = 'pending' | 'generated' | 'approved' | 'published' | 'frozen';

export interface MeritRecord {
    id: string;
    applicationId: string;
    candidate: string;
    applicationNo: string;
    program: string;
    entranceScore?: number;
    interviewScore?: number;
    finalMeritScore?: number;
    category?: string;
    rank?: number;
    seatStatus: MeritSeatStatus;
    recommendation?: string;
    meritStatus: MeritRecordStatus;
    waitlistPriority?: number;
    waitlistGroup?: string;
    remarks?: string;
}

export interface MeritQueueItem {
    applicationId: string;
    studentName: string;
    program?: string;
    status: string;
    meritStatus: MeritRecordStatus;
    rank?: number;
    seatStatus: MeritSeatStatus;
    hasMerit: boolean;
}

export interface MeritEvaluationSummary {
    total: number;
    selected: number;
    waitlisted: number;
    reserved: number;
    rejected: number;
    pending: number;
}

export interface MeritHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
}

const MERIT_ACTIONS = new Set([
    'MERIT_LIST_GENERATED',
    'MERIT_SELECTED',
    'MERIT_WAITLISTED',
    'MERIT_APPROVED',
    'MERIT_PUBLISHED',
]);

function normalizeList(data: unknown): Record<string, unknown>[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    return [data as Record<string, unknown>];
}

function num(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function str(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    return String(value);
}

/** Map exam API rows — first backend percentage only, no aggregation */
export function mapEntranceScoreFromExamResults(examData: unknown): number | undefined {
    const rows = normalizeList(examData);
    const row = rows[0];
    if (!row) return undefined;
    return num(row.percentage ?? row.total_score ?? row.marks_obtained);
}

/** Map interview scores from evaluation summary shape if present */
export function mapInterviewScoreFromSummary(interviewData: unknown): number | undefined {
    if (!interviewData || typeof interviewData !== 'object') return undefined;
    const obj = interviewData as Record<string, unknown>;
    const scores = normalizeList(obj.scores);
    if (scores.length === 0) return undefined;
    const first = scores[0];
    return num(first.score ?? first.percentage);
}

/** Map backend merit row — no local rank/score calculation */
export function mapMeritResultRow(
    raw: Record<string, unknown>,
    application?: Admission,
): MeritRecord {
    const applicationId = str(raw.application_id ?? raw.applicationId ?? application?.id) ?? '';
    const seatStatus = (str(raw.selection_status ?? raw.status ?? raw.selectionStatus)?.toUpperCase() ??
        'PENDING') as MeritSeatStatus;

    return {
        id: str(raw.id) ?? `${applicationId}-merit`,
        applicationId,
        candidate: application?.student_name ?? str(raw.candidate ?? raw.student_name) ?? '—',
        applicationNo: applicationId.slice(0, 8).toUpperCase(),
        program: application?.grade_applied_for ?? str(raw.program ?? raw.grade) ?? '—',
        entranceScore: num(raw.exam_percentage ?? raw.examPercentage ?? raw.entrance_score),
        interviewScore: num(raw.interview_percentage ?? raw.interviewPercentage ?? raw.interview_score),
        finalMeritScore: num(raw.final_score ?? raw.finalScore),
        category: str(raw.waitlist_group ?? raw.waitlistGroup ?? raw.category),
        rank: num(raw.rank ?? raw.merit_rank),
        seatStatus: ['SELECTED', 'WAITLISTED', 'RESERVED', 'REJECTED'].includes(seatStatus)
            ? seatStatus
            : 'PENDING',
        recommendation: str(raw.recommendation ?? raw.remarks),
        meritStatus: seatStatus === 'PENDING' ? 'pending' : 'generated',
        waitlistPriority: num(raw.waitlist_priority ?? raw.waitlistPriority),
        waitlistGroup: str(raw.waitlist_group ?? raw.waitlistGroup),
        remarks: str(raw.recommendation ?? raw.remarks),
    };
}

export function mapMeritRecordForApplication(
    application: Admission,
    meritData: unknown,
    examData?: unknown,
): MeritRecord {
    const meritObj = (meritData ?? null) as Record<string, unknown> | null;
    const base = meritObj
        ? mapMeritResultRow(meritObj, application)
        : {
              id: `${application.id}-merit-pending`,
              applicationId: application.id,
              candidate: application.student_name,
              applicationNo: application.id.slice(0, 8).toUpperCase(),
              program: application.grade_applied_for,
              seatStatus: 'PENDING' as MeritSeatStatus,
              meritStatus: 'pending' as MeritRecordStatus,
          };

    const logs = application.admission_audit_logs ?? [];
    const hasMeritLog = logs.some(l => MERIT_ACTIONS.has(l.action) || l.action.includes('MERIT'));
    const meritStatus: MeritRecordStatus = logs.some(l => l.action === 'MERIT_PUBLISHED')
        ? 'published'
        : logs.some(l => l.action === 'MERIT_APPROVED')
          ? 'approved'
          : hasMeritLog
            ? 'generated'
            : base.meritStatus;

    if (application.status === 'rejected') {
        base.seatStatus = 'REJECTED';
    } else if (['recommended', 'approved', 'enrolled'].includes(application.status) && base.seatStatus === 'PENDING') {
        base.seatStatus = 'SELECTED';
    }

    return {
        ...base,
        entranceScore: base.entranceScore ?? mapEntranceScoreFromExamResults(examData),
        meritStatus,
        recommendation:
            base.recommendation ??
            (application.status === 'recommended'
                ? 'RECOMMENDED'
                : application.status === 'rejected'
                  ? 'REJECTED'
                  : undefined),
    };
}

export function mapGeneratedMeritList(data: unknown, applications: Admission[]): MeritRecord[] {
    const rows = normalizeList(data);
    const appMap = new Map(applications.map(a => [a.id, a]));
    return rows
        .map(row => mapMeritResultRow(row, appMap.get(str(row.application_id ?? row.applicationId) ?? '')))
        .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
}

export function mapMeritQueueItem(app: Admission, meritData?: unknown): MeritQueueItem {
    const meritObj = meritData as Record<string, unknown> | null | undefined;
    const record = mapMeritRecordForApplication(app, meritObj);
    const hasMerit = !!meritObj || (app.admission_audit_logs ?? []).some(l => l.action.includes('MERIT'));

    return {
        applicationId: app.id,
        studentName: app.student_name,
        program: app.grade_applied_for,
        status: app.status,
        meritStatus: record.meritStatus,
        rank: record.rank,
        seatStatus: record.seatStatus,
        hasMerit,
    };
}

export function summarizeMeritRecords(records: MeritRecord[]): MeritEvaluationSummary {
    return {
        total: records.length,
        selected: records.filter(r => r.seatStatus === 'SELECTED').length,
        waitlisted: records.filter(r => r.seatStatus === 'WAITLISTED').length,
        reserved: records.filter(r => r.seatStatus === 'RESERVED').length,
        rejected: records.filter(r => r.seatStatus === 'REJECTED').length,
        pending: records.filter(r => r.seatStatus === 'PENDING').length,
    };
}

export function mapMeritHistory(logs?: AdmissionAuditLog[]): MeritHistoryEntry[] {
    return (logs ?? [])
        .filter(l => MERIT_ACTIONS.has(l.action) || l.action.includes('MERIT') || l.remarks?.includes('Merit'))
        .map(l => ({
            id: l.id,
            action: l.action,
            actor: l.users?.full_name,
            remarks: l.remarks,
            timestamp: l.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function filterMeritQueue(items: MeritQueueItem[], query: string): MeritQueueItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
        item =>
            item.studentName.toLowerCase().includes(q) ||
            item.applicationId.toLowerCase().includes(q) ||
            (item.program ?? '').toLowerCase().includes(q),
    );
}

export function meritRecordToExportRow(record: MeritRecord): Record<string, string> {
    return {
        Candidate: record.candidate,
        Application: record.applicationNo,
        Program: record.program,
        'Entrance Score': record.entranceScore !== undefined ? String(record.entranceScore) : '',
        'Interview Score': record.interviewScore !== undefined ? String(record.interviewScore) : '',
        'Final Merit': record.finalMeritScore !== undefined ? String(record.finalMeritScore) : '',
        Category: record.category ?? '',
        Rank: record.rank !== undefined ? String(record.rank) : '',
        'Seat Status': record.seatStatus,
        Recommendation: record.recommendation ?? '',
        Status: record.meritStatus,
    };
}
