import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';
import type { Admission } from '@/modules/admission/types/admission.types';

export type ApplicationRecord = Admission & {
  applicationNumber?: string;
  applicantName?: string;
  gradeApplyingFor?: string;
  submissionDate?: string;
  assessmentScore?: number;
  feePaidAmount?: number;
  [key: string]: any;
};

export interface VerifyDocumentPayload {
  applicationId: string;
  documentId: string;
  isVerified: boolean;
  notes?: string;
}

export interface RecordAssessmentPayload {
  applicationId: string;
  score: number;
  maxScore: number;
  evaluatorNotes?: string;
}

export interface MakeDecisionPayload {
  applicationId: string;
  decision: 'APPROVED' | 'REJECTED';
  remarks?: string;
}

export interface CollectFeePayload {
  applicationId: string;
  amount: number;
  paymentMode: 'ONLINE' | 'CHEQUE' | 'BANK_TRANSFER' | 'CASH';
  transactionRef: string;
}

export const admissionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getApplications: builder.query<ApplicationRecord[], Record<string, any> | void>({
      query: (params: Record<string, any> | void) => ({
        url: ENDPOINTS.ADMISSIONS.APPLICATIONS,
        params: params || undefined,
      }),
      providesTags: ['Application'],
    }),
    getApplicationById: builder.query<ApplicationRecord, string>({
      query: (id: string) => `/admissions/applications/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    verifyDocument: builder.mutation<{ success: boolean }, VerifyDocumentPayload>({
      query: (body: VerifyDocumentPayload) => ({
        url: ENDPOINTS.ADMISSIONS.DOCUMENTS(body.applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Application'],
    }),
    recordAssessment: builder.mutation<{ success: boolean }, RecordAssessmentPayload>({
      query: (body: RecordAssessmentPayload) => ({
        url: ENDPOINTS.ADMISSIONS.ASSESSMENT(body.applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Application'],
    }),
    makeDecision: builder.mutation<{ success: boolean }, MakeDecisionPayload>({
      query: (body: MakeDecisionPayload) => ({
        url: ENDPOINTS.ADMISSIONS.DECISION(body.applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Application'],
    }),
    collectFee: builder.mutation<{ success: boolean }, CollectFeePayload>({
      query: (body: CollectFeePayload) => ({
        url: ENDPOINTS.ADMISSIONS.FEES(body.applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Application', 'FeePayment'],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useGetApplicationByIdQuery,
  useVerifyDocumentMutation,
  useRecordAssessmentMutation,
  useMakeDecisionMutation,
  useCollectFeeMutation,
} = admissionApi;
