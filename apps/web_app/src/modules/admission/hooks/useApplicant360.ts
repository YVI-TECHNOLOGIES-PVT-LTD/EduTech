import { useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApplication } from './useApplication';
import { useTimeline } from './useTimeline';
import { useExamResults, useOffers } from './useOffers';
import { usePayments } from './usePayments';
import { useEnrollmentStatus } from './useEnrollment';
import { mapAuditLogs } from '../utils/timeline.mapper';
import { mapApplicant360View } from '../utils/applicant360.mapper';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { Applicant360View } from '../utils/applicant360.mapper';

const REFRESH_EVENTS = [
    ADMISSION_EVENTS.APPLICATION_CREATED,
    ADMISSION_EVENTS.APPLICATION_UPDATED,
    ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
    ADMISSION_EVENTS.DOCUMENT_VERIFIED,
    ADMISSION_EVENTS.PAYMENT_VERIFIED,
    ADMISSION_EVENTS.OFFER_SENT,
    ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
    ADMISSION_EVENTS.INQUIRY_CONVERTED,
    ADMISSION_EVENTS.DOCUMENT_UPLOADED,
    ADMISSION_EVENTS.DOCUMENT_REJECTED,
    ADMISSION_EVENTS.CHECKLIST_UPDATED,
    ADMISSION_EVENTS.INTERVIEW_CREATED,
    ADMISSION_EVENTS.INTERVIEW_UPDATED,
    ADMISSION_EVENTS.EXAM_COMPLETED,
    ADMISSION_EVENTS.FEE_PAID,
    ADMISSION_EVENTS.APPLICATION_APPROVED,
    ADMISSION_EVENTS.ERP_STUDENT_CREATED,
    ADMISSION_EVENTS.TIMELINE_REFRESH,
] as const;

/** Composed Applicant 360° view — all data via Admission Engine hooks */
export function useApplicant360(applicationId?: string) {
    const queryClient = useQueryClient();
    const { application, isLoading: appLoading, error, refetch: refetchApp } = useApplication(applicationId, {
        enabled: !!applicationId,
    });
    const { timeline, isLoading: timelineLoading, refetch: refetchTimeline } = useTimeline(applicationId);
    const { feesSummary, refetch: refetchPayments } = usePayments(applicationId);
    const { merit, isLoading: meritLoading } = useOffers(applicationId);
    const examQuery = useExamResults(applicationId ?? '');
    const enrollmentQuery = useEnrollmentStatus(applicationId);

    const refetchAll = useCallback(async () => {
        await Promise.all([
            refetchApp(),
            refetchTimeline(),
            refetchPayments(),
            examQuery.refetch(),
            enrollmentQuery.refetch(),
        ]);
    }, [refetchApp, refetchTimeline, refetchPayments, examQuery, enrollmentQuery]);

    useEffect(() => {
        if (!applicationId) return;

        const unsubs = REFRESH_EVENTS.map(event =>
            admissionEventBus.subscribe(event, payload => {
                const targetId = payload?.applicationId;
                if (!targetId || targetId === applicationId) {
                    refetchAll();
                    queryClient.invalidateQueries({
                        queryKey: ['admissions', 'detail', applicationId],
                    });
                }
            }),
        );

        return () => unsubs.forEach(unsub => unsub());
    }, [applicationId, refetchAll, queryClient]);

    const auditLogs = useMemo(() => {
        if (application?.admission_audit_logs?.length) {
            return mapAuditLogs(application.admission_audit_logs);
        }
        return timeline;
    }, [application?.admission_audit_logs, timeline]);

    const view: Applicant360View | null = useMemo(() => {
        if (!application) return null;
        return mapApplicant360View({
            application,
            auditLogs,
            examResults: examQuery.data,
            meritData: merit,
            feesSummary: feesSummary ?? null,
            enrollmentStatus: enrollmentQuery.data,
        });
    }, [application, auditLogs, examQuery.data, merit, feesSummary, enrollmentQuery.data]);

    return {
        view,
        application,
        auditLogs,
        isLoading: appLoading || timelineLoading || meritLoading || examQuery.isLoading || enrollmentQuery.isLoading,
        error: error ?? examQuery.error ?? enrollmentQuery.error,
        refetch: refetchAll,
        notFound: !appLoading && !application && !!applicationId,
    };
}

export type { Applicant360View };
