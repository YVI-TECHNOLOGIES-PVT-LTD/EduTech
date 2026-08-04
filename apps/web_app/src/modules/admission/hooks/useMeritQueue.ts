import { useMemo, useEffect, useCallback } from 'react';
import { useApplicationList } from './useApplication';
import { mapUIStatus } from '../core/AdmissionStatusMapper';
import { mapMeritQueueItem, filterMeritQueue, type MeritQueueItem } from '../utils/merit.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types/admission.types';

const MERIT_UI_STATUSES = new Set(['MERIT', 'OFFER', 'INTERVIEW', 'REVIEW']);

/** Applications eligible for merit list / selection */
export function useMeritQueue(search = '') {
    const recommended = useApplicationList({ status: 'recommended', limit: 200 });
    const approved = useApplicationList({ status: 'approved', limit: 200 });
    const underReview = useApplicationList({ status: 'under_review', limit: 200 });

    const refetchAll = useCallback(async () => {
        await Promise.all([recommended.refetch(), approved.refetch(), underReview.refetch()]);
    }, [recommended.refetch, approved.refetch, underReview.refetch]);

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
        [...recommended.applications, ...approved.applications, ...underReview.applications].forEach(app => {
            const ui = mapUIStatus(app.status);
            const hasMeritLog = app.admission_audit_logs?.some(
                l => l.action.includes('MERIT') || l.remarks?.includes('Merit'),
            );
            if (MERIT_UI_STATUSES.has(ui) || app.status === 'recommended' || hasMeritLog) {
                merged.set(app.id, app);
            }
        });
        return Array.from(merged.values());
    }, [recommended.applications, approved.applications, underReview.applications]);

    const queue: MeritQueueItem[] = useMemo(
        () => applications.map(app => mapMeritQueueItem(app)),
        [applications],
    );

    return {
        applications,
        queue: filterMeritQueue(queue, search),
        isLoading: recommended.isLoading || approved.isLoading || underReview.isLoading,
        refetch: refetchAll,
    };
}

export type { MeritQueueItem };
