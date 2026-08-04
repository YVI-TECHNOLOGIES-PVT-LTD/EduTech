import { useMemo, useEffect, useCallback } from 'react';
import { useApplicationList } from './useApplication';
import { mapUIStatus } from '../core/AdmissionStatusMapper';
import {
    mapEnrollmentQueueItem,
    filterEnrollmentQueue,
    type EnrollmentQueueItem,
} from '../utils/enrollment.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Admission } from '../types/admission.types';

const ENROLLMENT_UI_STATUSES = new Set(['FEE', 'ENROLLMENT', 'OFFER']);

/** Applications eligible for enrollment handoff */
export function useEnrollmentQueue(search = '', statusFilter = 'all') {
    const paymentVerified = useApplicationList({ status: 'payment_verified', limit: 200 });
    const approved = useApplicationList({ status: 'approved', limit: 200 });
    const enrolled = useApplicationList({ status: 'enrolled', limit: 200 });

    const refetchAll = useCallback(async () => {
        await Promise.all([paymentVerified.refetch(), approved.refetch(), enrolled.refetch()]);
    }, [paymentVerified.refetch, approved.refetch, enrolled.refetch]);

    useEffect(() => {
        const refresh = () => void refetchAll();
        const unsubs = [
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.PAYMENT_VERIFIED,
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
            ADMISSION_EVENTS.OFFER_SENT,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [refetchAll]);

    const applications = useMemo(() => {
        const merged = new Map<string, Admission>();
        [...paymentVerified.applications, ...approved.applications, ...enrolled.applications].forEach(app => {
            const ui = mapUIStatus(app.status);
            const hasEnrollLog = app.admission_audit_logs?.some(
                l =>
                    l.action.includes('ENROLL') ||
                    l.action.includes('CONFIRM') ||
                    l.action === 'STUDENT_ENROLLED',
            );
            if (
                ENROLLMENT_UI_STATUSES.has(ui) ||
                ['payment_verified', 'approved', 'enrolled'].includes(app.status) ||
                app.payment_verified ||
                hasEnrollLog
            ) {
                merged.set(app.id, app);
            }
        });
        return Array.from(merged.values());
    }, [paymentVerified.applications, approved.applications, enrolled.applications]);

    const queue: EnrollmentQueueItem[] = useMemo(
        () => applications.map(app => mapEnrollmentQueueItem(app)),
        [applications],
    );

    return {
        applications,
        queue: filterEnrollmentQueue(queue, search, statusFilter),
        isLoading: paymentVerified.isLoading || approved.isLoading || enrolled.isLoading,
        refetch: refetchAll,
    };
}

export type { EnrollmentQueueItem };
