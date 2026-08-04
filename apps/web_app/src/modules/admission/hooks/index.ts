/** Unified admission hooks — all orchestration goes through AdmissionEngine */

export { useAdmission } from './useAdmission';
export {
    useApplication,
    useApplicationList,
    useReviewQueue,
    type ApplicationListParams,
} from './useApplication';
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
export { useWorkflow, type WorkflowActionType } from './useWorkflow';
export { useApplicant360 } from './useApplicant360';
export {
    useEnrollment,
    useEnrollmentStatus,
    useEnrollStudent,
    useEnrollmentStatusQuery,
} from './useEnrollment';
export { useDocuments, useDocumentVerificationQueue } from './useDocuments';
export {
    usePayments,
    useFeesSummary,
    useCollectPayment,
} from './usePayments';
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
export { useInquiryWorkspace } from './useInquiryWorkspace';
export { useLeadAssignment } from './useLeadAssignment';
export { useLeadTimeline } from './useLeadTimeline';
export { useLeadSearch } from './useLeadSearch';
export { useLeadScore, useLeadScores } from './useLeadScore';
export { useCompleteFollowup, useUpdateFollowup } from './useFollowups';
