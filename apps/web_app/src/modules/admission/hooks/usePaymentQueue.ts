import { useMemo, useEffect, useCallback } from 'react';
import { useApplicationList } from './useApplication';
import { mapUIStatus } from '../core/AdmissionStatusMapper';
import { mapPaymentQueueItem, filterPaymentQueue, type PaymentQueueItem } from '../utils/finance.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types/admission.types';

const FEE_UI_STATUSES = new Set(['FEE', 'OFFER', 'ENROLLMENT']);

/** Applications eligible for finance / fee collection */
export function usePaymentQueue(search = '', statusFilter = 'all') {
    const paymentPending = useApplicationList({ status: 'payment_pending', limit: 200 });
    const paymentSubmitted = useApplicationList({ status: 'payment_submitted', limit: 200 });
    const paymentVerified = useApplicationList({ status: 'payment_verified', limit: 200 });
    const approved = useApplicationList({ status: 'approved', limit: 200 });

    const refetchAll = useCallback(async () => {
        await Promise.all([
            paymentPending.refetch(),
            paymentSubmitted.refetch(),
            paymentVerified.refetch(),
            approved.refetch(),
        ]);
    }, [paymentPending.refetch, paymentSubmitted.refetch, paymentVerified.refetch, approved.refetch]);

    useEffect(() => {
        const refresh = () => void refetchAll();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.OFFER_SENT,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [refetchAll]);

    const applications = useMemo(() => {
        const merged = new Map<string, Admission>();
        [
            ...paymentPending.applications,
            ...paymentSubmitted.applications,
            ...paymentVerified.applications,
            ...approved.applications,
        ].forEach(app => {
            const ui = mapUIStatus(app.status);
            const hasPaymentLog = app.admission_audit_logs?.some(
                l =>
                    l.action.toLowerCase().includes('payment') ||
                    l.action.toLowerCase().includes('fee') ||
                    l.action.toLowerCase().includes('receipt'),
            );
            if (
                FEE_UI_STATUSES.has(ui) ||
                ['payment_pending', 'payment_submitted', 'payment_verified', 'approved'].includes(app.status) ||
                app.payment_enabled ||
                hasPaymentLog
            ) {
                merged.set(app.id, app);
            }
        });
        return Array.from(merged.values());
    }, [
        paymentPending.applications,
        paymentSubmitted.applications,
        paymentVerified.applications,
        approved.applications,
    ]);

    const queue: PaymentQueueItem[] = useMemo(
        () => applications.map(app => mapPaymentQueueItem(app)),
        [applications],
    );

    return {
        applications,
        queue: filterPaymentQueue(queue, search, statusFilter),
        isLoading:
            paymentPending.isLoading ||
            paymentSubmitted.isLoading ||
            paymentVerified.isLoading ||
            approved.isLoading,
        refetch: refetchAll,
    };
}

export type { PaymentQueueItem };
