import { useMemo, useEffect, useCallback } from 'react';
import { useApplicationList } from './useApplication';
import { mapUIStatus } from '../core/AdmissionStatusMapper';
import { mapExamQueueItem, filterExamQueue, type ExamQueueItem } from '../utils/exam.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types/admission.types';

const EXAM_UI_STATUSES = new Set(['EXAM', 'DOCUMENTS', 'REVIEW']);

/** Applications eligible for entrance exam evaluation */
export function useExamQueue(search = '') {
    const docsVerified = useApplicationList({ status: 'docs_verified', limit: 200 });
    const underReview = useApplicationList({ status: 'under_review', limit: 200 });

    const refetchAll = useCallback(async () => {
        await Promise.all([docsVerified.refetch(), underReview.refetch()]);
    }, [docsVerified.refetch, underReview.refetch]);

    useEffect(() => {
        const refresh = () => void refetchAll();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.DOCUMENT_VERIFIED,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [refetchAll]);

    const applications = useMemo(() => {
        const merged = new Map<string, Admission>();
        [...docsVerified.applications, ...underReview.applications].forEach(app => {
            const ui = mapUIStatus(app.status);
            if (EXAM_UI_STATUSES.has(ui) || app.status === 'docs_verified') {
                merged.set(app.id, app);
            }
        });
        return Array.from(merged.values());
    }, [docsVerified.applications, underReview.applications]);

    const queue: ExamQueueItem[] = useMemo(
        () => applications.map(app => mapExamQueueItem(app)),
        [applications],
    );

    return {
        applications,
        queue: filterExamQueue(queue, search),
        isLoading: docsVerified.isLoading || underReview.isLoading,
        refetch: refetchAll,
    };
}

export type { ExamQueueItem };
