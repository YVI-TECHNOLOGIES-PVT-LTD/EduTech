/**
 * Frontend event dispatcher for admission domain changes.
 * Triggers coordinated React Query invalidation — no websockets, no backend events.
 */

export type AdmissionEventType =
    | 'APPLICATION_CREATED'
    | 'APPLICATION_UPDATED'
    | 'APPLICATION_LIST_CHANGED'
    | 'APPLICATION_REVIEWED'
    | 'APPLICATION_APPROVED'
    | 'DOCUMENT_VERIFIED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_REJECTED'
    | 'CHECKLIST_UPDATED'
    | 'PAYMENT_VERIFIED'
    | 'FEE_PAID'
    | 'OFFER_SENT'
    | 'ENROLLMENT_COMPLETED'
    | 'ERP_STUDENT_CREATED'
    | 'INTERVIEW_CREATED'
    | 'INTERVIEW_UPDATED'
    | 'EXAM_COMPLETED'
    | 'INQUIRY_CREATED'
    | 'INQUIRY_UPDATED'
    | 'INQUIRY_CONVERTED'
    | 'LEAD_ASSIGNED'
    | 'COUNSELOR_ASSIGNED'
    | 'FOLLOWUP_COMPLETED'
    | 'TIMELINE_REFRESH'
    | 'QUEUE_REFRESH'
    | 'DASHBOARD_REFRESH';

export interface AdmissionEventPayload {
    applicationId?: string;
    inquiryId?: string;
    leadId?: string;
    documentId?: string;
    [key: string]: unknown;
}

type AdmissionEventListener = (payload?: AdmissionEventPayload) => void;

class AdmissionEventBus {
    private listeners = new Map<AdmissionEventType, Set<AdmissionEventListener>>();

    subscribe(type: AdmissionEventType, listener: AdmissionEventListener): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);
        return () => this.listeners.get(type)?.delete(listener);
    }

    dispatch(type: AdmissionEventType, payload?: AdmissionEventPayload): void {
        this.listeners.get(type)?.forEach(listener => listener(payload));
    }
}

export const admissionEventBus = new AdmissionEventBus();

export const ADMISSION_EVENTS = {
    APPLICATION_CREATED: 'APPLICATION_CREATED' as const,
    APPLICATION_UPDATED: 'APPLICATION_UPDATED' as const,
    APPLICATION_LIST_CHANGED: 'APPLICATION_LIST_CHANGED' as const,
    APPLICATION_REVIEWED: 'APPLICATION_REVIEWED' as const,
    APPLICATION_APPROVED: 'APPLICATION_APPROVED' as const,
    DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED' as const,
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED' as const,
    DOCUMENT_REJECTED: 'DOCUMENT_REJECTED' as const,
    CHECKLIST_UPDATED: 'CHECKLIST_UPDATED' as const,
    PAYMENT_VERIFIED: 'PAYMENT_VERIFIED' as const,
    FEE_PAID: 'FEE_PAID' as const,
    OFFER_SENT: 'OFFER_SENT' as const,
    ENROLLMENT_COMPLETED: 'ENROLLMENT_COMPLETED' as const,
    ERP_STUDENT_CREATED: 'ERP_STUDENT_CREATED' as const,
    INTERVIEW_CREATED: 'INTERVIEW_CREATED' as const,
    INTERVIEW_UPDATED: 'INTERVIEW_UPDATED' as const,
    EXAM_COMPLETED: 'EXAM_COMPLETED' as const,
    INQUIRY_CREATED: 'INQUIRY_CREATED' as const,
    INQUIRY_UPDATED: 'INQUIRY_UPDATED' as const,
    INQUIRY_CONVERTED: 'INQUIRY_CONVERTED' as const,
    LEAD_ASSIGNED: 'LEAD_ASSIGNED' as const,
    COUNSELOR_ASSIGNED: 'COUNSELOR_ASSIGNED' as const,
    FOLLOWUP_COMPLETED: 'FOLLOWUP_COMPLETED' as const,
    TIMELINE_REFRESH: 'TIMELINE_REFRESH' as const,
    QUEUE_REFRESH: 'QUEUE_REFRESH' as const,
    DASHBOARD_REFRESH: 'DASHBOARD_REFRESH' as const,
};

/** Stage 3 document/checklist events invalidate the same caches as document verified */
export const STAGE3_DOCUMENT_EVENTS = [
    ADMISSION_EVENTS.DOCUMENT_UPLOADED,
    ADMISSION_EVENTS.DOCUMENT_REJECTED,
    ADMISSION_EVENTS.CHECKLIST_UPDATED,
] as const;
