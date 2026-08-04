import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';

export interface ApplicationProgressSection {
    label: string;
    status: string;
    completed?: number;
    total?: number;
    percent?: number;
}

export interface ApplicationProgressReport {
    applicationId: string;
    applicationStatus: string;
    progressPercent: number;
    checklistCompletionPercent: number;
    sections: {
        documents: ApplicationProgressSection & { completed: number; total: number; percent: number };
        interview: ApplicationProgressSection;
        exam: ApplicationProgressSection;
        fees: ApplicationProgressSection;
        verification: ApplicationProgressSection;
    };
    documentItems: Array<{
        code: string;
        name: string;
        mandatory: boolean;
        uploaded: boolean;
        verified: boolean;
        status: string;
        documentId?: string;
    }>;
}

const PROGRESS_EVENTS = [
    ADMISSION_EVENTS.APPLICATION_UPDATED,
    ADMISSION_EVENTS.DOCUMENT_UPLOADED,
    ADMISSION_EVENTS.DOCUMENT_VERIFIED,
    ADMISSION_EVENTS.DOCUMENT_REJECTED,
    ADMISSION_EVENTS.CHECKLIST_UPDATED,
    ADMISSION_EVENTS.INTERVIEW_CREATED,
    ADMISSION_EVENTS.INTERVIEW_UPDATED,
    ADMISSION_EVENTS.EXAM_COMPLETED,
    ADMISSION_EVENTS.FEE_PAID,
    ADMISSION_EVENTS.PAYMENT_VERIFIED,
    ADMISSION_EVENTS.APPLICATION_REVIEWED,
    ADMISSION_EVENTS.APPLICATION_APPROVED,
    ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
    ADMISSION_EVENTS.ERP_STUDENT_CREATED,
] as const;

export function useApplicationProgress(applicationId?: string) {
    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.progress(applicationId ?? ''),
        queryFn: () =>
            admissionApi.getApplicationProgress(applicationId!).then(res => res.data as ApplicationProgressReport),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => void query.refetch();
        const unsubs = PROGRESS_EVENTS.map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, query.refetch]);

    return {
        progress: query.data ?? null,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function formatSectionStatus(status: string): string {
    switch (status) {
        case 'completed':
        case 'approved':
            return 'Completed';
        case 'in_progress':
            return 'In Progress';
        case 'rejected':
        case 'failed':
            return 'Failed';
        default:
            return 'Pending';
    }
}
