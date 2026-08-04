import { useMemo, useEffect, useCallback } from 'react';
import { useReviewQueue } from './useApplication';
import {
    filterVerificationQueue,
    summarizeVerification,
    type VerificationApplicationSummary,
} from '../utils/documentVerification.mapper';
import type { Admission } from '../types/admission.types';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';

const QUEUE_STATUSES = ['submitted', 'under_review'] as const;

/** Applications awaiting document verification */
export function useVerificationQueue(search = '') {
    const submitted = useReviewQueue('submitted');
    const underReview = useReviewQueue('under_review');

    useEffect(() => {
        const refresh = () => {
            void submitted.refetch();
            void underReview.refetch();
        };
        const unsubs = [
            ADMISSION_EVENTS.DOCUMENT_VERIFIED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.QUEUE_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [submitted.refetch, underReview.refetch]);

    const applications = useMemo(() => {
        const merged = new Map<string, Admission>();
        [...(submitted.applications ?? []), ...(underReview.applications ?? [])].forEach(app => {
            merged.set(app.id, app);
        });
        return filterVerificationQueue(Array.from(merged.values()), search);
    }, [submitted.applications, underReview.applications, search]);

    const summaries: VerificationApplicationSummary[] = useMemo(
        () =>
            applications.map(app => {
                const docs = app.admission_documents ?? [];
                const pending = docs.length === 0 ? 1 : docs.filter(d => !!d.file_url).length;
                return {
                    applicationId: app.id,
                    studentName: app.student_name,
                    grade: app.grade_applied_for,
                    status: app.status,
                    totalDocuments: docs.length || 1,
                    verifiedCount: app.status === 'docs_verified' ? docs.length : 0,
                    pendingCount: app.status !== 'docs_verified' ? pending : 0,
                    rejectedCount: 0,
                    missingCount: docs.length === 0 ? 1 : docs.filter(d => !d.file_url).length,
                    submittedAt: app.submitted_at ?? app.created_at,
                };
            }),
        [applications],
    );

    return {
        applications,
        summaries,
        isLoading: submitted.isLoading || underReview.isLoading,
        refetch: useCallback(async () => {
            await Promise.all([submitted.refetch(), underReview.refetch()]);
        }, [submitted, underReview]),
    };
}

export type { VerificationApplicationSummary };
