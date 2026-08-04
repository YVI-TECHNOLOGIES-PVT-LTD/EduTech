import type { Admission, AdmissionDocument, AdmissionAuditLog } from '../types/admission.types';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'missing' | 'correction';

export interface VerificationDocument {
    id: string;
    applicationId: string;
    name: string;
    category: string;
    required: boolean;
    uploaded: boolean;
    status: DocumentVerificationStatus;
    remarks?: string;
    uploadedAt?: string;
    verifiedBy?: string;
    verifiedAt?: string;
    fileUrl?: string;
    version: number;
}

export interface VerificationApplicationSummary {
    applicationId: string;
    studentName: string;
    grade?: string;
    status: string;
    totalDocuments: number;
    verifiedCount: number;
    pendingCount: number;
    rejectedCount: number;
    missingCount: number;
    submittedAt?: string;
}

export interface VerificationHistoryEntry {
    id: string;
    action: string;
    actor?: string;
    remarks?: string;
    timestamp: string;
    documentName?: string;
}

const REQUIRED_DOC_TYPES = [
    'birth certificate',
    'transfer certificate',
    'marksheet',
    'address proof',
    'photo',
    'aadhar',
];

export function isRequiredDocumentType(documentType: string): boolean {
    const t = documentType.toLowerCase();
    return REQUIRED_DOC_TYPES.some(r => t.includes(r)) || t.includes('certificate');
}

function parseDocStatusFromAudit(
    doc: AdmissionDocument,
    audits: AdmissionAuditLog[],
    appStatus: string,
): Pick<VerificationDocument, 'status' | 'remarks' | 'verifiedBy' | 'verifiedAt'> {
    const docName = doc.document_type.toLowerCase();
    const verifiedStatuses = ['docs_verified', 'payment_pending', 'payment_submitted', 'payment_verified', 'recommended', 'approved', 'enrolled'];

    const matchingAudits = audits.filter(a => {
        const action = a.action.toLowerCase();
        const remarks = (a.remarks ?? '').toLowerCase();
        return remarks.includes(docName) || action.includes('doc');
    });

    const rejection = matchingAudits.find(
        a =>
            a.remarks?.toLowerCase().includes('reject') ||
            a.remarks?.toLowerCase().includes('re-upload') ||
            a.remarks?.toLowerCase().includes('correction'),
    );
    if (rejection) {
        return {
            status: 'correction',
            remarks: rejection.remarks,
            verifiedBy: rejection.users?.full_name,
            verifiedAt: rejection.created_at,
        };
    }

    if (verifiedStatuses.includes(appStatus)) {
        const verifyLog = matchingAudits.find(a => a.action.toLowerCase().includes('doc')) ??
            audits.find(a => a.action === 'DOCS_VERIFIED');
        return {
            status: 'verified',
            remarks: verifyLog?.remarks,
            verifiedBy: verifyLog?.users?.full_name,
            verifiedAt: verifyLog?.created_at,
        };
    }

    if (!doc.file_url) {
        return { status: 'missing' };
    }

    return { status: 'pending' };
}

export function mapAdmissionDocument(
    doc: AdmissionDocument,
    application: Admission,
): VerificationDocument {
    const audits = application.admission_audit_logs ?? [];
    const parsed = parseDocStatusFromAudit(doc, audits, application.status);

    return {
        id: doc.id,
        applicationId: doc.admission_id,
        name: doc.document_type.replace(/_/g, ' '),
        category: doc.document_type,
        required: isRequiredDocumentType(doc.document_type),
        uploaded: !!doc.file_url,
        fileUrl: doc.file_url,
        uploadedAt: doc.uploaded_at,
        version: 1,
        ...parsed,
    };
}

export function mapApplicationDocuments(application: Admission): VerificationDocument[] {
    const docs = application.admission_documents ?? [];
    if (docs.length === 0) {
        return [{
            id: `${application.id}-empty`,
            applicationId: application.id,
            name: 'No documents uploaded',
            category: 'general',
            required: true,
            uploaded: false,
            status: 'missing',
            version: 0,
        }];
    }
    return docs.map(d => mapAdmissionDocument(d, application));
}

export function summarizeVerification(
    application: Admission,
    documents: VerificationDocument[],
): VerificationApplicationSummary {
    return {
        applicationId: application.id,
        studentName: application.student_name,
        grade: application.grade_applied_for,
        status: application.status,
        totalDocuments: documents.length,
        verifiedCount: documents.filter(d => d.status === 'verified').length,
        pendingCount: documents.filter(d => d.status === 'pending').length,
        rejectedCount: documents.filter(d => d.status === 'rejected' || d.status === 'correction').length,
        missingCount: documents.filter(d => d.status === 'missing').length,
        submittedAt: application.submitted_at ?? application.created_at,
    };
}

export function mapVerificationHistory(application: Admission): VerificationHistoryEntry[] {
    return (application.admission_audit_logs ?? [])
        .filter(
            log =>
                log.action.toLowerCase().includes('doc') ||
                log.remarks?.toLowerCase().includes('document') ||
                log.remarks?.toLowerCase().includes('upload'),
        )
        .map(log => ({
            id: log.id,
            action: log.action,
            actor: log.users?.full_name,
            remarks: log.remarks,
            timestamp: log.created_at,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function buildCompleteVerificationRemark(documents: VerificationDocument[]): string {
    const names = documents.filter(d => d.uploaded && d.status !== 'missing').map(d => d.name);
    return `All documents verified: ${names.join(', ')}`;
}

export function buildReuploadRemark(document: VerificationDocument, reason: string): string {
    return `Re-upload required — ${document.name}: ${reason}`;
}

export function filterVerificationDocuments(
    documents: VerificationDocument[],
    query: string,
    statusFilter: string,
): VerificationDocument[] {
    const q = query.trim().toLowerCase();
    return documents.filter(doc => {
        if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
        if (!q) return true;
        return [doc.name, doc.category, doc.remarks, doc.status]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(q));
    });
}

export function filterVerificationQueue(
    apps: Admission[],
    query: string,
): Admission[] {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
        app =>
            app.student_name.toLowerCase().includes(q) ||
            app.id.toLowerCase().includes(q) ||
            (app.grade_applied_for ?? '').toLowerCase().includes(q),
    );
}
