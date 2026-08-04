import type { Admission, AdmissionAuditLog } from '../types/admission.types';

export type ExamResultStatus = 'pending' | 'published' | 'approved' | 'rejected' | 'absent' | 'draft';

export interface ExamRecord {
    id: string;
    applicationId: string;
    candidateId?: string;
    subjectId?: string;
    examName: string;
    examDate?: string;
    center?: string;
    subject: string;
    totalMarks?: number;
    obtainedMarks?: number;
    percentage?: number;
    grade?: string;
    passFail: 'PASS' | 'FAIL' | 'PENDING' | 'ABSENT';
    evaluator?: string;
    evaluationDate?: string;
    remarks?: string;
    status: ExamResultStatus;
    studentName?: string;
}

export interface ExamQueueItem {
    applicationId: string;
    studentName: string;
    grade?: string;
    status: string;
    examStatus: ExamResultStatus;
    resultsCount: number;
    hasResults: boolean;
    submittedAt?: string;
}

export interface ExamEvaluationSummary {
    total: number;
    published: number;
    pending: number;
    passed: number;
    failed: number;
    absent: number;
}

export interface ExamHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
}

function normalizeList(data: unknown): Record<string, unknown>[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    const obj = data as { results?: unknown[]; data?: unknown[] };
    return (obj.results ?? obj.data ?? []) as Record<string, unknown>[];
}

/** Map backend exam result row — no local score calculation */
export function mapExamResultRow(
    raw: Record<string, unknown>,
    application: Admission,
    sessionMeta?: { room?: string; examDate?: string; invigilator?: string },
): ExamRecord {
    const obtained = Number(raw.marks_obtained ?? raw.marksObtained ?? 0);
    const percentage = raw.percentage !== undefined ? Number(raw.percentage) : undefined;
    const pass = raw.pass === true || raw.pass === 'true';
    const passFail: ExamRecord['passFail'] =
        raw.attendance_status === 'ABSENT' ? 'ABSENT' :
        raw.pass === undefined ? 'PENDING' :
        pass ? 'PASS' : 'FAIL';

    const subjectId = String(raw.subject_id ?? raw.subjectId ?? '');
    const examName = String(raw.exam_name ?? raw.subject_name ?? raw.subject ?? (subjectId || 'Entrance Exam'));

    return {
        id: String(raw.id ?? `${application.id}-${subjectId}`),
        applicationId: application.id,
        candidateId: String(raw.candidate_id ?? raw.candidateId ?? ''),
        subjectId,
        examName,
        examDate: sessionMeta?.examDate ?? (raw.exam_date as string | undefined),
        center: sessionMeta?.room ?? (raw.center as string | undefined) ?? (raw.room_name as string | undefined),
        subject: examName,
        totalMarks: raw.max_marks !== undefined ? Number(raw.max_marks) : undefined,
        obtainedMarks: obtained || undefined,
        percentage,
        grade: raw.grade ? String(raw.grade) : passFail === 'PENDING' ? undefined : passFail,
        passFail,
        evaluator: String(raw.evaluator_name ?? raw.evaluator_id ?? sessionMeta?.invigilator ?? ''),
        evaluationDate: String(raw.created_at ?? raw.updated_at ?? ''),
        remarks: raw.remarks ? String(raw.remarks) : undefined,
        status: passFail === 'PENDING' ? 'pending' : 'published',
        studentName: application.student_name,
    };
}

export function mapExamResultsResponse(
    data: unknown,
    application: Admission,
): ExamRecord[] {
    const rows = normalizeList(data);
    if (rows.length === 0) {
        return [{
            id: `${application.id}-pending`,
            applicationId: application.id,
            examName: 'Entrance Examination',
            subject: application.grade_applied_for ?? 'General',
            passFail: 'PENDING',
            status: 'pending',
            studentName: application.student_name,
        }];
    }
    return rows.map(row => mapExamResultRow(row, application));
}

export function summarizeExamRecords(records: ExamRecord[]): ExamEvaluationSummary {
    return {
        total: records.length,
        published: records.filter(r => r.status === 'published').length,
        pending: records.filter(r => r.status === 'pending').length,
        passed: records.filter(r => r.passFail === 'PASS').length,
        failed: records.filter(r => r.passFail === 'FAIL').length,
        absent: records.filter(r => r.passFail === 'ABSENT').length,
    };
}

export function mapExamQueueItem(app: Admission, resultsCount = 0): ExamQueueItem {
    const hasResults = resultsCount > 0;
    return {
        applicationId: app.id,
        studentName: app.student_name,
        grade: app.grade_applied_for,
        status: app.status,
        examStatus: hasResults ? 'published' : 'pending',
        resultsCount,
        hasResults,
        submittedAt: app.submitted_at ?? app.created_at,
    };
}

export function mapExamHistory(logs?: AdmissionAuditLog[]): ExamHistoryEntry[] {
    return (logs ?? [])
        .filter(
            l =>
                l.action.toLowerCase().includes('exam') ||
                l.remarks?.toLowerCase().includes('exam') ||
                l.action === 'EXAM_MARKS_PUBLISHED',
        )
        .map(l => ({
            id: l.id,
            action: l.action,
            actor: l.users?.full_name,
            remarks: l.remarks,
            timestamp: l.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function filterExamQueue(items: ExamQueueItem[], query: string): ExamQueueItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
        item =>
            item.studentName.toLowerCase().includes(q) ||
            item.applicationId.toLowerCase().includes(q) ||
            (item.grade ?? '').toLowerCase().includes(q),
    );
}

export function filterExamRecords(records: ExamRecord[], query: string, status?: string): ExamRecord[] {
    const q = query.trim().toLowerCase();
    return records.filter(r => {
        if (status && status !== 'all' && r.status !== status && r.passFail !== status) return false;
        if (!q) return true;
        return [r.examName, r.subject, r.studentName, r.center, r.passFail]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(q));
    });
}

export function examRecordToExportRow(record: ExamRecord): Record<string, string> {
    return {
        Student: record.studentName ?? '',
        Exam: record.examName,
        Subject: record.subject,
        Center: record.center ?? '',
        Obtained: record.obtainedMarks !== undefined ? String(record.obtainedMarks) : '',
        Percentage: record.percentage !== undefined ? `${record.percentage}%` : '',
        'Pass/Fail': record.passFail,
        Evaluator: record.evaluator ?? '',
        Date: record.evaluationDate ?? '',
    };
}
