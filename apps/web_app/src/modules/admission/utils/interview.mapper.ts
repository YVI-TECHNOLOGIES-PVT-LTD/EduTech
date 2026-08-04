import type { Admission, AdmissionAuditLog } from '../types/admission.types';

export type InterviewRecordStatus =
    | 'pending'
    | 'scheduled'
    | 'in_progress'
    | 'evaluated'
    | 'completed'
    | 'recommended'
    | 'rejected';

export type InterviewAttendance = 'PENDING' | 'PRESENT' | 'ABSENT';

export interface InterviewRecord {
    id: string;
    applicationId: string;
    candidate: string;
    applicationNo: string;
    program: string;
    interviewDate?: string;
    interviewSlot?: string;
    panelMembers?: string;
    room?: string;
    status: InterviewRecordStatus;
    attendance: InterviewAttendance;
    panelScore?: number;
    remarks?: string;
    recommendation?: 'RECOMMENDED' | 'REJECTED' | 'PENDING';
    interviewId?: string;
    panelId?: string;
}

export interface InterviewQueueItem {
    applicationId: string;
    studentName: string;
    program?: string;
    status: string;
    interviewStatus: InterviewRecordStatus;
    scheduledAt?: string;
    hasInterview: boolean;
    isEvaluated: boolean;
}

export interface InterviewEvaluationSummary {
    total: number;
    scheduled: number;
    pending: number;
    evaluated: number;
    recommended: number;
    rejected: number;
    absent: number;
}

export interface InterviewHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
}

const INTERVIEW_ACTIONS = new Set([
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_COMPLETED',
    'INTERVIEW_EVALUATION_COMPLETED',
    'INTERVIEW_STARTED',
]);

function parsePanelFromRemarks(remarks?: string): string | undefined {
    if (!remarks) return undefined;
    const match = remarks.match(/Interview panel \[([^\]]+)\]/i);
    return match?.[1];
}

function parseRoomFromRemarks(remarks?: string): string | undefined {
    if (!remarks) return undefined;
    const match = remarks.match(/in room ([^.]+)/i);
    return match?.[1]?.trim();
}

function parseDateFromRemarks(remarks?: string): string | undefined {
    if (!remarks) return undefined;
    const match = remarks.match(/on ([^.]+)\./i);
    return match?.[1]?.trim();
}

function findInterviewAuditLogs(logs?: AdmissionAuditLog[]): AdmissionAuditLog[] {
    return (logs ?? []).filter(
        l =>
            INTERVIEW_ACTIONS.has(l.action) ||
            l.action.toLowerCase().includes('interview') ||
            l.remarks?.toLowerCase().includes('interview'),
    );
}

function resolveInterviewId(logs: AdmissionAuditLog[]): string | undefined {
    const scheduled = logs.find(l => l.action === 'INTERVIEW_SCHEDULED');
    if (scheduled?.id) {
        return scheduled.id;
    }
    const completed = logs.find(l => l.action === 'INTERVIEW_EVALUATION_COMPLETED');
    return completed?.id;
}

function resolveAttendance(logs: AdmissionAuditLog[]): InterviewAttendance {
    const absent = logs.some(
        l => l.remarks?.toLowerCase().includes('absent') || l.action.toLowerCase().includes('absent'),
    );
    if (absent) return 'ABSENT';
    const present = logs.some(
        l =>
            l.action === 'INTERVIEW_COMPLETED' ||
            l.action === 'INTERVIEW_EVALUATION_COMPLETED' ||
            l.remarks?.toLowerCase().includes('present'),
    );
    if (present) return 'PRESENT';
    const started = logs.some(l => l.action === 'INTERVIEW_STARTED' || l.remarks?.toLowerCase().includes('started'));
    if (started) return 'PRESENT';
    return 'PENDING';
}

function resolveRecordStatus(app: Admission, logs: AdmissionAuditLog[]): InterviewRecordStatus {
    if (app.status === 'rejected') return 'rejected';
    if (['recommended', 'approved', 'enrolled'].includes(app.status)) return 'recommended';
    if (logs.some(l => l.action === 'INTERVIEW_EVALUATION_COMPLETED' || l.action === 'INTERVIEW_COMPLETED')) {
        return 'evaluated';
    }
    if (logs.some(l => l.action === 'INTERVIEW_STARTED')) return 'in_progress';
    if (logs.some(l => l.action === 'INTERVIEW_SCHEDULED')) return 'scheduled';
    return 'pending';
}

function resolveRecommendation(app: Admission): InterviewRecord['recommendation'] {
    if (app.status === 'rejected') return 'REJECTED';
    if (['recommended', 'approved', 'enrolled'].includes(app.status)) return 'RECOMMENDED';
    return 'PENDING';
}

/** Map interview view from application audit logs + backend merit — no local score math */
export function mapInterviewRecord(
    application: Admission,
    meritData?: unknown,
): InterviewRecord {
    const logs = findInterviewAuditLogs(application.admission_audit_logs);
    const scheduledLog = logs.find(l => l.action === 'INTERVIEW_SCHEDULED');
    const status = resolveRecordStatus(application, logs);
    const meritObj = meritData as Record<string, unknown> | null | undefined;
    const panelScore =
        meritObj?.final_score !== undefined
            ? Number(meritObj.final_score)
            : meritObj?.interview_score !== undefined
              ? Number(meritObj.interview_score)
              : undefined;

    const remarks =
        logs.find(l => l.action === 'INTERVIEW_EVALUATION_COMPLETED')?.remarks ??
        scheduledLog?.remarks ??
        application.remark_by_officer;

    return {
        id: `${application.id}-interview`,
        applicationId: application.id,
        candidate: application.student_name,
        applicationNo: application.id.slice(0, 8).toUpperCase(),
        program: application.grade_applied_for,
        interviewDate: parseDateFromRemarks(scheduledLog?.remarks) ?? scheduledLog?.created_at,
        interviewSlot: scheduledLog?.created_at
            ? new Date(scheduledLog.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
            : undefined,
        panelMembers: parsePanelFromRemarks(scheduledLog?.remarks),
        room: parseRoomFromRemarks(scheduledLog?.remarks),
        status,
        attendance: resolveAttendance(logs),
        panelScore: Number.isFinite(panelScore) ? panelScore : undefined,
        remarks: remarks ?? undefined,
        recommendation: resolveRecommendation(application),
        interviewId: resolveInterviewId(logs),
    };
}

export function mapInterviewQueueItem(app: Admission): InterviewQueueItem {
    const logs = findInterviewAuditLogs(app.admission_audit_logs);
    const hasInterview = logs.some(l => l.action === 'INTERVIEW_SCHEDULED');
    const isEvaluated = logs.some(
        l => l.action === 'INTERVIEW_EVALUATION_COMPLETED' || l.action === 'INTERVIEW_COMPLETED',
    );
    const scheduledLog = logs.find(l => l.action === 'INTERVIEW_SCHEDULED');

    return {
        applicationId: app.id,
        studentName: app.student_name,
        program: app.grade_applied_for,
        status: app.status,
        interviewStatus: resolveRecordStatus(app, logs),
        scheduledAt: scheduledLog?.created_at ?? app.submitted_at ?? app.created_at,
        hasInterview,
        isEvaluated,
    };
}

export function summarizeInterviewRecords(records: InterviewRecord[]): InterviewEvaluationSummary {
    return {
        total: records.length,
        scheduled: records.filter(r => r.status === 'scheduled' || r.status === 'in_progress').length,
        pending: records.filter(r => r.status === 'pending').length,
        evaluated: records.filter(r => r.status === 'evaluated' || r.status === 'completed').length,
        recommended: records.filter(r => r.recommendation === 'RECOMMENDED').length,
        rejected: records.filter(r => r.recommendation === 'REJECTED').length,
        absent: records.filter(r => r.attendance === 'ABSENT').length,
    };
}

export function mapInterviewHistory(logs?: AdmissionAuditLog[]): InterviewHistoryEntry[] {
    return findInterviewAuditLogs(logs)
        .map(l => ({
            id: l.id,
            action: l.action,
            actor: l.users?.full_name,
            remarks: l.remarks,
            timestamp: l.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function filterInterviewQueue(items: InterviewQueueItem[], query: string): InterviewQueueItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
        item =>
            item.studentName.toLowerCase().includes(q) ||
            item.applicationId.toLowerCase().includes(q) ||
            (item.program ?? '').toLowerCase().includes(q),
    );
}

export function interviewRecordToExportRow(record: InterviewRecord): Record<string, string> {
    return {
        Candidate: record.candidate,
        'Application No': record.applicationNo,
        Program: record.program,
        Date: record.interviewDate ?? '',
        Slot: record.interviewSlot ?? '',
        Panel: record.panelMembers ?? '',
        Room: record.room ?? '',
        Status: record.status,
        Attendance: record.attendance,
        Score: record.panelScore !== undefined ? String(record.panelScore) : '',
        Recommendation: record.recommendation ?? '',
        Remarks: record.remarks ?? '',
    };
}
