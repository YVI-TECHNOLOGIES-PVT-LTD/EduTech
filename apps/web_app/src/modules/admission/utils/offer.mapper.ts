import type { Admission, AdmissionAuditLog } from '../types/admission.types';

export type OfferStatus =
    | 'PENDING'
    | 'GENERATED'
    | 'SENT'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'WITHDRAWN'
    | 'DEFERRED'
    | 'CONDITIONAL';

export interface OfferRecord {
    id: string;
    applicationId: string;
    candidate: string;
    applicationNo: string;
    program: string;
    offerNumber?: string;
    templateId?: string;
    issueDate?: string;
    expiryDate?: string;
    sentAt?: string;
    status: OfferStatus;
    seatConfirmed?: boolean;
    scholarship?: string;
    priority?: string;
    parentEmail?: string;
    remarks?: string;
    meritRank?: number;
}

export interface OfferQueueItem {
    applicationId: string;
    studentName: string;
    program?: string;
    status: string;
    offerStatus: OfferStatus;
    offerNumber?: string;
    hasOffer: boolean;
    expiryDate?: string;
}

export interface OfferSummaryStats {
    total: number;
    pending: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    deferred: number;
}

export interface OfferHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
}

export interface OfferAuditEntry extends OfferHistoryEntry {
    entityId?: string;
    beforeState?: string;
    afterState?: string;
}

const OFFER_ACTIONS = new Set([
    'OFFER_GENERATED',
    'OFFER_GENERATED_SENT',
    'OFFER_SENT',
    'OFFER_ACCEPTED',
    'OFFER_REJECTED',
    'OFFER_EXPIRED',
    'OFFER_WITHDRAWN',
    'OFFER_DEFERRED',
]);

function findOfferLogs(logs?: AdmissionAuditLog[]): AdmissionAuditLog[] {
    return (logs ?? []).filter(
        l =>
            OFFER_ACTIONS.has(l.action) ||
            l.action.includes('OFFER') ||
            l.remarks?.toLowerCase().includes('offer'),
    );
}

function parseOfferNumber(remarks?: string): string | undefined {
    if (!remarks) return undefined;
    const match = remarks.match(/OFFER-[A-Z0-9-]+/i) ?? remarks.match(/Offer generated: ([^.]+)/i);
    return match?.[1]?.trim() ?? match?.[0];
}

function parseExpiryFromRemarks(remarks?: string): string | undefined {
    if (!remarks) return undefined;
    const match = remarks.match(/Valid until ([^.]+)/i);
    return match?.[1]?.trim();
}

function mapBackendOfferStatus(raw: unknown, app: Admission, logs: AdmissionAuditLog[]): OfferStatus {
    const status = String(raw ?? '').toUpperCase();
    if (status === 'ACCEPTED' || logs.some(l => l.action === 'OFFER_ACCEPTED')) return 'ACCEPTED';
    if (status === 'EXPIRED' || logs.some(l => l.action === 'OFFER_REJECTED')) return 'REJECTED';
    if (status === 'SENT' || status === 'GENERATED') return 'SENT';
    if (logs.some(l => l.action === 'OFFER_GENERATED' || l.action === 'OFFER_GENERATED_SENT')) return 'SENT';
    if (app.status === 'approved' || app.status === 'enrolled') return 'ACCEPTED';
    if (app.status === 'rejected') return 'REJECTED';
    return 'PENDING';
}

/** Map backend offer row or audit — no local expiry/status decisions */
export function mapOfferResultRow(
    raw: Record<string, unknown>,
    application: Admission,
): OfferRecord {
    const logs = findOfferLogs(application.admission_audit_logs);
    const generatedLog = logs.find(l => l.action.includes('OFFER_GENERATED') || l.action.includes('OFFER_SENT'));

    return {
        id: String(raw.id ?? `${application.id}-offer`),
        applicationId: application.id,
        candidate: application.student_name,
        applicationNo: application.id.slice(0, 8).toUpperCase(),
        program: application.grade_applied_for,
        offerNumber: String(raw.offer_number ?? raw.offerNumber ?? parseOfferNumber(generatedLog?.remarks) ?? ''),
        templateId: raw.template_id ? String(raw.template_id) : undefined,
        issueDate: String(raw.issue_date ?? raw.issueDate ?? generatedLog?.created_at ?? ''),
        expiryDate: String(raw.expiry_date ?? raw.expiryDate ?? parseExpiryFromRemarks(generatedLog?.remarks) ?? ''),
        sentAt: String(raw.sent_at ?? raw.sentAt ?? generatedLog?.created_at ?? ''),
        status: mapBackendOfferStatus(raw.status, application, logs),
        seatConfirmed: raw.seat_confirmed === true || appStatusSeatConfirmed(application.status),
        scholarship: raw.scholarship ? String(raw.scholarship) : undefined,
        priority: raw.priority ? String(raw.priority) : undefined,
        parentEmail: application.parent_email ?? application.applicant?.email,
        remarks: generatedLog?.remarks ?? application.remark_by_officer,
    };
}

function appStatusSeatConfirmed(status: Admission['status']): boolean {
    return status === 'approved' || status === 'enrolled' || status === 'payment_verified';
}

export function mapOfferRecordForApplication(
    application: Admission,
    offerData?: unknown,
    meritData?: unknown,
): OfferRecord {
    const meritObj = meritData as Record<string, unknown> | null | undefined;
    if (offerData && typeof offerData === 'object') {
        const record = mapOfferResultRow(offerData as Record<string, unknown>, application);
        return { ...record, meritRank: num(meritObj?.rank) };
    }

    const logs = findOfferLogs(application.admission_audit_logs);
    const generatedLog = logs.find(l => l.action.includes('OFFER'));

    return {
        id: `${application.id}-offer-pending`,
        applicationId: application.id,
        candidate: application.student_name,
        applicationNo: application.id.slice(0, 8).toUpperCase(),
        program: application.grade_applied_for,
        offerNumber: parseOfferNumber(generatedLog?.remarks),
        issueDate: generatedLog?.created_at,
        expiryDate: parseExpiryFromRemarks(generatedLog?.remarks),
        status: mapBackendOfferStatus(undefined, application, logs),
        parentEmail: application.parent_email ?? application.applicant?.email,
        remarks: generatedLog?.remarks,
        meritRank: num(meritObj?.rank),
        seatConfirmed: appStatusSeatConfirmed(application.status),
    };
}

function num(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

export function mapOfferQueueItem(app: Admission): OfferQueueItem {
    const record = mapOfferRecordForApplication(app);
    const hasOffer = (app.admission_audit_logs ?? []).some(l => l.action.includes('OFFER'));

    return {
        applicationId: app.id,
        studentName: app.student_name,
        program: app.grade_applied_for,
        status: app.status,
        offerStatus: record.status,
        offerNumber: record.offerNumber,
        hasOffer,
        expiryDate: record.expiryDate,
    };
}

export function summarizeOfferRecords(records: OfferRecord[]): OfferSummaryStats {
    return {
        total: records.length,
        pending: records.filter(r => r.status === 'PENDING').length,
        sent: records.filter(r => r.status === 'SENT' || r.status === 'GENERATED').length,
        accepted: records.filter(r => r.status === 'ACCEPTED').length,
        rejected: records.filter(r => r.status === 'REJECTED' || r.status === 'WITHDRAWN').length,
        expired: records.filter(r => r.status === 'EXPIRED').length,
        deferred: records.filter(r => r.status === 'DEFERRED').length,
    };
}

export function mapOfferHistory(logs?: AdmissionAuditLog[]): OfferHistoryEntry[] {
    return findOfferLogs(logs)
        .map(l => ({
            id: l.id,
            action: l.action,
            actor: l.users?.full_name,
            remarks: l.remarks,
            timestamp: l.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function mapOfferAudit(logs?: AdmissionAuditLog[]): OfferAuditEntry[] {
    return mapOfferHistory(logs).map(e => ({
        ...e,
        entityId: e.id,
    }));
}

export function filterOfferQueue(items: OfferQueueItem[], query: string, statusFilter?: string): OfferQueueItem[] {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
        if (statusFilter && statusFilter !== 'all' && item.offerStatus !== statusFilter) return false;
        if (!q) return true;
        return (
            item.studentName.toLowerCase().includes(q) ||
            item.applicationId.toLowerCase().includes(q) ||
            (item.offerNumber ?? '').toLowerCase().includes(q)
        );
    });
}

export function filterOfferRecords(records: OfferRecord[], statusFilter?: string): OfferRecord[] {
    if (!statusFilter || statusFilter === 'all') return records;
    return records.filter(r => r.status === statusFilter);
}

export function offerRecordToExportRow(record: OfferRecord): Record<string, string> {
    return {
        Candidate: record.candidate,
        Application: record.applicationNo,
        Program: record.program,
        'Offer No': record.offerNumber ?? '',
        Status: record.status,
        Issued: record.issueDate ?? '',
        Expires: record.expiryDate ?? '',
        Email: record.parentEmail ?? '',
        Rank: record.meritRank !== undefined ? String(record.meritRank) : '',
    };
}

/** @deprecated use mapOfferRecordForApplication */
export function mapOffer(data: unknown): import('../types/admission.types').AdmissionOffer | null {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    return {
        id: obj.id ? String(obj.id) : undefined,
        applicationId: String(obj.application_id ?? obj.applicationId ?? ''),
        status: String(obj.status ?? 'pending').toLowerCase() as import('../types/admission.types').AdmissionOffer['status'],
        sentAt: obj.sent_at ? String(obj.sent_at) : undefined,
    };
}

export function mapOfferList(data: unknown): import('../types/admission.types').AdmissionOffer[] {
    if (!data) return [];
    if (Array.isArray(data)) return data.map(row => mapOffer(row)).filter(Boolean) as import('../types/admission.types').AdmissionOffer[];
    const single = mapOffer(data);
    return single ? [single] : [];
}
