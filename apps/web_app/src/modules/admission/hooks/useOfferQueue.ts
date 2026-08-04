import { useMemo, useEffect, useCallback } from 'react';
import { useApplicationList } from './useApplication';
import { mapUIStatus } from '../core/AdmissionStatusMapper';
import { mapOfferQueueItem, filterOfferQueue, type OfferQueueItem } from '../utils/offer.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types/admission.types';

const OFFER_UI_STATUSES = new Set(['OFFER', 'FEE', 'MERIT', 'ENROLLMENT']);

/** Applications eligible for offer management */
export function useOfferQueue(search = '', statusFilter = 'all') {
    const approved = useApplicationList({ status: 'approved', limit: 200 });
    const recommended = useApplicationList({ status: 'recommended', limit: 200 });
    const enrolled = useApplicationList({ status: 'enrolled', limit: 200 });

    const refetchAll = useCallback(async () => {
        await Promise.all([approved.refetch(), recommended.refetch(), enrolled.refetch()]);
    }, [approved.refetch, recommended.refetch, enrolled.refetch]);

    useEffect(() => {
        const refresh = () => void refetchAll();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.OFFER_SENT,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [refetchAll]);

    const applications = useMemo(() => {
        const merged = new Map<string, Admission>();
        [...approved.applications, ...recommended.applications, ...enrolled.applications].forEach(app => {
            const ui = mapUIStatus(app.status);
            const hasOfferLog = app.admission_audit_logs?.some(l => l.action.includes('OFFER'));
            if (
                OFFER_UI_STATUSES.has(ui) ||
                ['recommended', 'approved', 'enrolled'].includes(app.status) ||
                hasOfferLog
            ) {
                merged.set(app.id, app);
            }
        });
        return Array.from(merged.values());
    }, [approved.applications, recommended.applications, enrolled.applications]);

    const queue: OfferQueueItem[] = useMemo(
        () => applications.map(app => mapOfferQueueItem(app)),
        [applications],
    );

    return {
        applications,
        queue: filterOfferQueue(queue, search, statusFilter),
        isLoading: approved.isLoading || recommended.isLoading || enrolled.isLoading,
        refetch: refetchAll,
    };
}

export type { OfferQueueItem };
