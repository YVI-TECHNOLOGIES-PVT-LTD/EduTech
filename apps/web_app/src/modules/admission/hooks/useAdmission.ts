import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';

/** Module-level stats and refresh orchestration */
export function useAdmission(schoolId?: string) {
    const statsQuery = useQuery({
        queryKey: AdmissionEngine.cacheKeys.stats(schoolId),
        queryFn: () => admissionApi.getStats(schoolId).then(res => res.data).catch(() => null),
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        const refresh = () => void statsQuery.refetch();
        const unsubs = [
            ADMISSION_EVENTS.DASHBOARD_REFRESH,
            ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
            ADMISSION_EVENTS.QUEUE_REFRESH,
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
            ADMISSION_EVENTS.INQUIRY_CREATED,
            ADMISSION_EVENTS.INQUIRY_UPDATED,
            ADMISSION_EVENTS.INQUIRY_CONVERTED,
            ADMISSION_EVENTS.APPLICATION_CREATED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
            ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
            ADMISSION_EVENTS.TIMELINE_REFRESH,
        ].map(event => admissionEventBus.subscribe(event, refresh));
        return () => unsubs.forEach(u => u());
    }, [statsQuery.refetch]);

    return {
        stats: statsQuery.data,
        isLoading: statsQuery.isLoading,
        error: statsQuery.error,
        refetch: statsQuery.refetch,
        refreshSignal: AdmissionEngine.getRefreshSignal(),
        triggerRefresh: () => AdmissionEngine.triggerRefresh(),
    };
}

/** Backward-compatible re-exports (legacy import path: hooks/useAdmission) */
export {
    useInquiries,
    useInquiry,
    useEnquiryDetails,
    useCreateEnquiry,
    useUpdateEnquiry,
    useConvertEnquiry,
    useLeads,
    useLeadDetails,
    useAssignLead,
    useFollowups,
    useCreateFollowup,
    useVisitors,
    useCreateVisitor,
} from './useInquiry';

export {
    useApplication,
    useApplicationList,
    useReviewQueue,
} from './useApplication';

export { useWorkflow, type WorkflowActionType } from './useWorkflow';
export { useApplicant360 } from './useApplicant360';
export { useApplicationProgress } from './useApplicationProgress';
export { useCrmDocuments, useUploadDocument } from './useCrmDocuments';
export { useEnrollment, useEnrollStudent, useEnrollmentStatus } from './useEnrollment';
export { useDocuments, useDocumentVerificationQueue } from './useDocuments';
export { usePayments, useFeesSummary, useCollectPayment } from './usePayments';
export {
    useOffers,
    useMeritList,
    useGenerateMeritList,
    useExamResults,
    useRecordExamMarks,
    useInterviewSchedule,
    useRecordInterviewScore,
    useAcceptOffer,
    useRejectOffer,
} from './useOffers';
export { useTimeline } from './useTimeline';
export { usePipeline } from './usePipeline';
export { useDocumentVerification } from './useDocumentVerification';
export { useVerificationQueue } from './useVerificationQueue';
export { useExamEvaluation } from './useExamEvaluation';
export { useExamQueue } from './useExamQueue';
export { useInterviewEvaluation } from './useInterviewEvaluation';
export { useInterviewQueue } from './useInterviewQueue';
export { useMeritWorkspace } from './useMeritWorkspace';
export { useMeritQueue } from './useMeritQueue';
export { useOfferWorkspace } from './useOfferWorkspace';
export { useOfferQueue } from './useOfferQueue';
export { useFinanceWorkspace } from './useFinanceWorkspace';
export { usePaymentQueue } from './usePaymentQueue';
export { useEnrollmentWorkspace } from './useEnrollmentWorkspace';
export { useEnrollmentQueue } from './useEnrollmentQueue';
export { useStudentProvisioning } from './useStudentProvisioning';
export { useLeadDashboard } from './useLeads';
export { useLeadAssignment } from './useLeadAssignment';
export { useLeadTimeline } from './useLeadTimeline';
export { useLeadSearch } from './useLeadSearch';
export { useLeadScore, useLeadScores } from './useLeadScore';
export { useCompleteFollowup, useUpdateFollowup, useFollowupsByBucket } from './useFollowups';
