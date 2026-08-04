import { useMemo, useEffect, useCallback } from 'react';
import { useApplicationList } from './useApplication';
import { mapUIStatus } from '../core/AdmissionStatusMapper';
import { mapInterviewQueueItem, filterInterviewQueue, type InterviewQueueItem } from '../utils/interview.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types/admission.types';

const INTERVIEW_UI_STATUSES = new Set(['INTERVIEW', 'EXAM', 'MERIT', 'REVIEW']);

/** Applications eligible for interview panel evaluation */
export function useInterviewQueue(search = '') {
    const recommended = useApplicationList({ status: 'recommended', limit: 200 });
    const underReview = useApplicationList({ status: 'under_review', limit: 200 });
    const docsVerified = useApplicationList({ status: 'docs_verified', limit: 200 });

    const refetchAll = useCallback(async () => {
        await Promise.all([recommended.refetch(), underReview.refetch(), docsVerified.refetch()]);
    }, [recommended.refetch, underReview.refetch, docsVerified.refetch]);

    useEffect(() => {
        const refresh = () => void refetchAll();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [refetchAll]);

    const applications = useMemo(() => {
        const merged = new Map<string, Admission>();
        [...recommended.applications, ...underReview.applications, ...docsVerified.applications].forEach(app => {
            const ui = mapUIStatus(app.status);
            const hasInterviewLog = app.admission_audit_logs?.some(
                l => l.action.includes('INTERVIEW') || l.remarks?.toLowerCase().includes('interview'),
            );
            if (INTERVIEW_UI_STATUSES.has(ui) || app.status === 'recommended' || hasInterviewLog) {
                merged.set(app.id, app);
            }
        });
        return Array.from(merged.values());
    }, [recommended.applications, underReview.applications, docsVerified.applications]);

    const queue: InterviewQueueItem[] = useMemo(
        () => applications.map(app => mapInterviewQueueItem(app)),
        [applications],
    );

    return {
        applications,
        queue: filterInterviewQueue(queue, search),
        isLoading: recommended.isLoading || underReview.isLoading || docsVerified.isLoading,
        refetch: refetchAll,
    };
}

export type { InterviewQueueItem };
