import type { QueryClient } from '@tanstack/react-query';
import { ADMISSION_CACHE_KEYS } from './AdmissionCache';
import {
    admissionEventBus,
    ADMISSION_EVENTS,
    type AdmissionEventType,
    type AdmissionEventPayload,
} from './AdmissionEvents';

/**
 * Single orchestration layer for admission data flow.
 * Coordinates cache invalidation, refresh signals, and event dispatch.
 * Contains no business logic.
 */
class AdmissionEngineImpl {
    private refreshSignal = 0;
    private refreshListeners = new Set<() => void>();

    /** Increment global refresh signal */
    triggerRefresh(): void {
        this.refreshSignal += 1;
        this.refreshListeners.forEach(fn => fn());
    }

    getRefreshSignal(): number {
        return this.refreshSignal;
    }

    subscribeRefresh(listener: () => void): () => void {
        this.refreshListeners.add(listener);
        return () => this.refreshListeners.delete(listener);
    }

    /** Dispatch domain event and invalidate related caches */
    dispatch(
        queryClient: QueryClient,
        type: AdmissionEventType,
        payload?: AdmissionEventPayload,
    ): void {
        admissionEventBus.dispatch(type, payload);
        this.invalidateForEvent(queryClient, type, payload);
        this.triggerRefresh();
    }

    /** Invalidate caches based on event type */
    invalidateForEvent(
        queryClient: QueryClient,
        type: AdmissionEventType,
        payload?: AdmissionEventPayload,
    ): void {
        const appId = payload?.applicationId;

        switch (type) {
            case ADMISSION_EVENTS.APPLICATION_CREATED:
            case ADMISSION_EVENTS.APPLICATION_UPDATED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.documents(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.myApplications() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.followups() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.reviewQueue() });
                if (payload?.inquiryId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.detail(payload.inquiryId) });
                }
                if (payload?.leadId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.detail(payload.leadId) });
                }
                break;

            case ADMISSION_EVENTS.APPLICATION_LIST_CHANGED:
            case ADMISSION_EVENTS.QUEUE_REFRESH:
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.myApplications() });
                break;

            case ADMISSION_EVENTS.DOCUMENT_VERIFIED:
            case ADMISSION_EVENTS.DOCUMENT_UPLOADED:
            case ADMISSION_EVENTS.DOCUMENT_REJECTED:
            case ADMISSION_EVENTS.CHECKLIST_UPDATED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.documents(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.reviewQueue() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                break;

            case ADMISSION_EVENTS.PAYMENT_VERIFIED:
            case ADMISSION_EVENTS.FEE_PAID:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.payments(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.feesSummary(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                break;

            case ADMISSION_EVENTS.INTERVIEW_CREATED:
            case ADMISSION_EVENTS.INTERVIEW_UPDATED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.interviewEvaluation(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                break;

            case ADMISSION_EVENTS.EXAM_COMPLETED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.examResults(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                break;

            case ADMISSION_EVENTS.APPLICATION_REVIEWED:
            case ADMISSION_EVENTS.APPLICATION_APPROVED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.reviewQueue() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                break;

            case ADMISSION_EVENTS.ERP_STUDENT_CREATED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.enrollment(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ['students'] });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                break;

            case ADMISSION_EVENTS.OFFER_SENT:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.offers(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                }
                break;

            case ADMISSION_EVENTS.ENROLLMENT_COMPLETED:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.enrollment(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.feesSummary(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.payments(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.progress(appId) });
                }
                queryClient.invalidateQueries({ queryKey: ['students'] });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                break;

            case ADMISSION_EVENTS.INQUIRY_CREATED:
            case ADMISSION_EVENTS.INQUIRY_UPDATED:
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.followups() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                if (payload?.inquiryId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.detail(payload.inquiryId) });
                }
                break;

            case ADMISSION_EVENTS.INQUIRY_CONVERTED:
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.followups() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.reviewQueue() });
                if (payload?.inquiryId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.detail(payload.inquiryId) });
                }
                if (payload?.leadId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.detail(payload.leadId) });
                }
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.detail(appId) });
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                }
                break;

            case ADMISSION_EVENTS.LEAD_ASSIGNED:
            case ADMISSION_EVENTS.COUNSELOR_ASSIGNED:
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.all });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.followups() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.all });
                if (payload?.leadId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.lead.detail(payload.leadId) });
                }
                if (payload?.inquiryId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.detail(payload.inquiryId) });
                }
                break;

            case ADMISSION_EVENTS.FOLLOWUP_COMPLETED:
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.followups() });
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.inquiry.all });
                break;

            case ADMISSION_EVENTS.TIMELINE_REFRESH:
                if (appId) {
                    queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.timeline(appId) });
                }
                break;

            case ADMISSION_EVENTS.DASHBOARD_REFRESH:
                queryClient.invalidateQueries({ queryKey: ADMISSION_CACHE_KEYS.stats() });
                break;
        }
    }

    /** Prefetch application detail */
    async prefetchApplication(
        queryClient: QueryClient,
        fetchFn: () => Promise<unknown>,
        id: string,
    ): Promise<void> {
        await queryClient.prefetchQuery({
            queryKey: ADMISSION_CACHE_KEYS.detail(id),
            queryFn: fetchFn,
        });
    }

    get cacheKeys() {
        return ADMISSION_CACHE_KEYS;
    }

    get events() {
        return ADMISSION_EVENTS;
    }
}

export const AdmissionEngine = new AdmissionEngineImpl();

export { ADMISSION_CACHE_KEYS, ADMISSION_STALE_TIME, ADMISSION_GC_TIME } from './AdmissionCache';
export {
    mapBackendStatus,
    mapLegacyStatus,
    mapUIStatus,
    getNextStatus,
    getPreviousStatus,
    getStatusColor,
    getStatusIcon,
    getProgressPercentage,
    formatStatusLabel,
} from './AdmissionStatusMapper';
export { AdmissionPermissions } from './AdmissionPermissions';
export { AdmissionRegistry } from './AdmissionRegistry';
export { admissionEventBus, ADMISSION_EVENTS } from './AdmissionEvents';
export type { AdmissionEventType } from './AdmissionEvents';
