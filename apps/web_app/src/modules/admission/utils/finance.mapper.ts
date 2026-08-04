import type { Admission, AdmissionAuditLog } from '../types/admission.types';

export type PaymentRecordStatus =
    | 'PENDING'
    | 'SUBMITTED'
    | 'COMPLETED'
    | 'VERIFIED'
    | 'FAILED'
    | 'REJECTED'
    | 'REFUNDED';

export interface PaymentRecord {
    id: string;
    applicationId: string;
    candidate: string;
    applicationNo: string;
    program: string;
    paymentId?: string;
    amount?: number;
    totalAssigned?: number;
    totalPaid?: number;
    totalWaived?: number;
    outstanding?: number;
    paymentMode?: string;
    transactionNumber?: string;
    receiptNumber?: string;
    status: PaymentRecordStatus;
    verifiedAt?: string;
    scholarship?: string;
    waiverAmount?: number;
    remarks?: string;
}

export interface PaymentQueueItem {
    applicationId: string;
    studentName: string;
    program?: string;
    status: string;
    paymentStatus: PaymentRecordStatus;
    outstanding?: number;
    amount?: number;
    hasPaymentActivity: boolean;
}

export interface PaymentSummaryStats {
    total: number;
    pending: number;
    submitted: number;
    verified: number;
    failed: number;
    outstanding: number;
}

export interface PaymentHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
}

export interface PaymentAuditEntry extends PaymentHistoryEntry {
    entityId?: string;
}

export interface ReceiptRecord {
    paymentId: string;
    receiptNumber?: string;
    issuedAt?: string;
    amount?: number;
    raw?: unknown;
}

const PAYMENT_ACTIONS = new Set([
    'PAYMENT_INITIALIZED',
    'PAYMENT_VERIFIED',
    'PAYMENT_COMPLETED',
    'PAYMENT_FAILED',
    'FEE_WAIVER_APPLIED',
    'RECEIPT_GENERATED',
]);

function num(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}

function str(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    return String(value);
}

function findPaymentLogs(logs?: AdmissionAuditLog[]): AdmissionAuditLog[] {
    return (logs ?? []).filter(
        l =>
            PAYMENT_ACTIONS.has(l.action) ||
            l.action.toLowerCase().includes('payment') ||
            l.action.toLowerCase().includes('fee') ||
            l.action.toLowerCase().includes('receipt') ||
            l.action.toLowerCase().includes('waiver'),
    );
}

function mapAppPaymentStatus(app: Admission): PaymentRecordStatus {
    if (app.payment_verified || app.status === 'payment_verified') return 'VERIFIED';
    if (app.status === 'payment_correction') return 'REJECTED';
    if (app.status === 'payment_submitted') return 'SUBMITTED';
    if (app.payment_enabled || app.status === 'payment_pending') return 'PENDING';
    return 'PENDING';
}

/** Map fees summary from backend — no local balance math */
export function mapFeesSummaryData(data: unknown): {
    totalAssigned?: number;
    totalPaid?: number;
    totalWaived?: number;
    outstanding?: number;
    components?: Record<string, unknown>[];
} {
    if (!data || typeof data !== 'object') return {};
    const obj = data as Record<string, unknown>;
    return {
        totalAssigned: num(obj.totalAssignedAmount ?? obj.total_assigned_amount),
        totalPaid: num(obj.totalPaidAmount ?? obj.total_paid_amount),
        totalWaived: num(obj.totalWaivedAmount ?? obj.total_waived_amount),
        outstanding: num(obj.totalOutstandingAmount ?? obj.total_outstanding_amount),
        components: (obj.components ?? obj.breakdown ?? []) as Record<string, unknown>[],
    };
}

export function mapPaymentRecordForApplication(
    application: Admission,
    feesSummary?: unknown,
    paymentRaw?: Record<string, unknown> | null,
): PaymentRecord {
    const fees = mapFeesSummaryData(feesSummary);
    const logs = findPaymentLogs(application.admission_audit_logs);
    const payLog = logs.find(l => l.action.includes('PAYMENT'));

    const status = paymentRaw?.status
        ? (String(paymentRaw.status).toUpperCase() as PaymentRecordStatus)
        : mapAppPaymentStatus(application);

    return {
        id: `${application.id}-payment`,
        applicationId: application.id,
        candidate: application.student_name,
        applicationNo: application.id.slice(0, 8).toUpperCase(),
        program: application.grade_applied_for,
        paymentId: str(paymentRaw?.id ?? paymentRaw?.payment_id),
        amount: num(paymentRaw?.amount) ?? application.payment_amount ?? fees.totalPaid,
        totalAssigned: fees.totalAssigned,
        totalPaid: fees.totalPaid,
        totalWaived: fees.totalWaived,
        outstanding: fees.outstanding,
        paymentMode: str(paymentRaw?.payment_mode ?? paymentRaw?.paymentMode ?? application.payment_mode),
        transactionNumber: str(
            paymentRaw?.transaction_number ?? paymentRaw?.gateway_reference ?? application.payment_reference,
        ),
        receiptNumber: str(paymentRaw?.receipt_number ?? paymentRaw?.receiptNumber),
        status,
        verifiedAt: application.payment_verified ? application.payment_date : undefined,
        waiverAmount: fees.totalWaived,
        remarks: payLog?.remarks ?? application.remark_by_finance,
    };
}

export function mapPaymentQueueItem(app: Admission, feesSummary?: unknown): PaymentQueueItem {
    const record = mapPaymentRecordForApplication(app, feesSummary);
    const hasPaymentActivity =
        !!app.payment_enabled ||
        !!app.payment_amount ||
        (app.admission_audit_logs ?? []).some(l => l.action.toLowerCase().includes('payment'));

    return {
        applicationId: app.id,
        studentName: app.student_name,
        program: app.grade_applied_for,
        status: app.status,
        paymentStatus: record.status,
        outstanding: record.outstanding,
        amount: record.amount,
        hasPaymentActivity,
    };
}

export function mapReceiptRecord(data: unknown, paymentId: string): ReceiptRecord | null {
    if (!data) return null;
    const obj = (data as { data?: unknown }).data ?? data;
    if (!obj || typeof obj !== 'object') return null;
    const row = obj as Record<string, unknown>;
    return {
        paymentId,
        receiptNumber: str(row.receipt_number ?? row.receiptNumber),
        issuedAt: str(row.issued_at ?? row.created_at ?? row.issuedAt),
        amount: num(row.amount),
        raw: obj,
    };
}

export function summarizePaymentRecords(records: PaymentRecord[]): PaymentSummaryStats {
    return {
        total: records.length,
        pending: records.filter(r => r.status === 'PENDING').length,
        submitted: records.filter(r => r.status === 'SUBMITTED').length,
        verified: records.filter(r => r.status === 'VERIFIED' || r.status === 'COMPLETED').length,
        failed: records.filter(r => r.status === 'FAILED' || r.status === 'REJECTED').length,
        outstanding: records.filter(r => (r.outstanding ?? 0) > 0).length,
    };
}

export function mapPaymentHistory(logs?: AdmissionAuditLog[]): PaymentHistoryEntry[] {
    return findPaymentLogs(logs)
        .map(l => ({
            id: l.id,
            action: l.action,
            actor: l.users?.full_name,
            remarks: l.remarks,
            timestamp: l.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function mapPaymentAudit(logs?: AdmissionAuditLog[]): PaymentAuditEntry[] {
    return mapPaymentHistory(logs);
}

export function filterPaymentQueue(
    items: PaymentQueueItem[],
    query: string,
    statusFilter?: string,
): PaymentQueueItem[] {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
        if (statusFilter && statusFilter !== 'all' && item.paymentStatus !== statusFilter) return false;
        if (!q) return true;
        return (
            item.studentName.toLowerCase().includes(q) ||
            item.applicationId.toLowerCase().includes(q) ||
            (item.program ?? '').toLowerCase().includes(q)
        );
    });
}

export function paymentRecordToExportRow(record: PaymentRecord): Record<string, string> {
    return {
        Candidate: record.candidate,
        Application: record.applicationNo,
        Program: record.program,
        Amount: record.amount !== undefined ? String(record.amount) : '',
        Outstanding: record.outstanding !== undefined ? String(record.outstanding) : '',
        Status: record.status,
        Mode: record.paymentMode ?? '',
        Receipt: record.receiptNumber ?? '',
        Reference: record.transactionNumber ?? '',
    };
}

/** @deprecated use mapPaymentRecordForApplication */
export function mapPaymentFromApplication(app: Admission): import('../types/admission.types').AdmissionPayment | null {
    const record = mapPaymentRecordForApplication(app);
    if (!record.amount && !app.payment_enabled) return null;
    return {
        id: record.paymentId,
        applicationId: record.applicationId,
        amount: record.amount ?? 0,
        mode: record.paymentMode,
        reference: record.transactionNumber,
        status:
            record.status === 'VERIFIED' || record.status === 'COMPLETED'
                ? 'verified'
                : record.status === 'SUBMITTED'
                  ? 'submitted'
                  : record.status === 'REJECTED' || record.status === 'FAILED'
                    ? 'rejected'
                    : 'pending',
        verifiedAt: record.verifiedAt,
    };
}

export function mapFeesSummary(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') return {};
    return data as Record<string, unknown>;
}
