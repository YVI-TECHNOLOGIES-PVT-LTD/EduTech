import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';
import type { Admission } from '@/modules/admission/types/admission.types';

export interface DocumentTypeDto {
  document_type_id: string;
  org_id: string;
  document_name: string;
  description?: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SignedUrlResponseDto {
  document_id: string;
  application_id: string;
  signed_url: string;
  expires_at: string;
  document?: any;
}

export interface VerifyAdmissionDocumentPayload {
  documentId: string;
  applicationId?: string;
  verify_status: 'verified' | 'rejected' | 'resubmission_requested' | 'pending';
  verification_remarks?: string | null;
}

export interface DocumentResponseDto {
  document_id: string;
  application_id?: string;
  document_type_id: string;
  original_file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  verify_status: string;
  verification_remarks?: string | null;
  uploaded_at: string;
  verified_by?: string | null;
  verified_at?: string | null;
  document_type_name?: string;
  document_types?: DocumentTypeDto | null;
}

export interface AssessmentResponseDto {
  assessment_id: string;
  config_id: string;
  assessment_date: string;
  maximum_marks: number | null;
  marks_obtained: number | null;
  percentage: number | null;
  result: string | null;
  remarks?: string | null;
  assessed_by?: string | null;
}

export interface DecisionResponseDto {
  decision_id: string;
  decision_status: string;
  decision_date: string;
  decided_by?: string | null;
  reason?: string | null;
  remarks?: string | null;
  offer_expiry_date?: string | null;
  waitlist_position?: number | null;
  scholarship_percentage?: number | null;
}

export interface FeePaymentResponseDto {
  payment_id: string;
  payment_status: string;
  amount: number;
  payment_date?: string | null;
  transaction_reference?: string | null;
  payment_mode?: string | null;
  card_name?: string | null;
  card_last_four?: string | null;
  remarks?: string | null;
}

export interface OrgBankDetailsDto {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
}

export interface ApplicationFeeDetailsDto {
  application_id: string;
  application_number: string;
  org_id: string;
  org_name?: string | null;
  academic_year_id: string;
  currency: string;
  application_fee: number;
  processing_fee: number;
  total_fee: number;
  scholarship_percentage?: number | null;
  payment_status: string;
  bank_details?: OrgBankDetailsDto | null;
  payment?: {
    payment_id: string;
    payment_status: string;
    amount: number;
    payment_date?: string | null;
    transaction_reference?: string | null;
    payment_mode?: string | null;
    card_name?: string | null;
    card_last_four?: string | null;
    remarks?: string | null;
  } | null;
}

export interface RecordApplicationPaymentPayload {
  applicationId: string;
  amount?: number;
  payment_status?: 'pending' | 'partial' | 'paid' | 'failed' | 'waived' | 'refunded';
  payment_mode?: 'cash' | 'card' | 'bank_transfer' | 'upi';
  payment_date?: string;
  transaction_reference?: string;
  card_name?: string;
  card_last_four?: string;
  remarks?: string;
}

export interface FeeReceiptDto {
  receipt_id: string;
  receipt_number: string;
  payment_id: string;
  application_id: string;
  application_number: string;
  student_name: string;
  grade_name?: string | null;
  academic_year_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  org_id: string;
  org_name: string;
  amount: number;
  application_fee: number;
  processing_fee: number;
  total_fee: number;
  currency: string;
  payment_status: string;
  payment_mode: string;
  transaction_reference: string;
  payment_date: string;
  remarks?: string | null;
  issued_at: string;
}

export interface ApplicationItem {
  application_id: string;
  id: string;
  lead_id: string;
  org_id: string;
  academic_year_id: string;
  application_number: string;
  application_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  nationality?: string | null;
  previous_school_name?: string | null;
  previous_school_address?: string | null;
  previous_school_board?: string | null;
  previous_grade?: string | null;
  previous_school_year?: string | null;
  student_name?: string | null;
  grade_id?: string | null;
  grade_name?: string | null;
  lead?: {
    lead_id: string;
    lead_number: string;
    student_first_name: string;
    student_last_name?: string | null;
    student_name: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string | null;
    contact_relationship?: string | null;
    gender?: string | null;
    dob?: string | null;
    curriculum_preference?: string | null;
    grade_id?: string | null;
    grade_name?: string | null;
    assigned_counsellor_id?: string | null;
    counselor_name?: string | null;
  } | null;
  academic_year?: {
    academic_year_id: string;
    academic_year_name: string;
  } | null;
  documents?: DocumentResponseDto[];
  documents_summary?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  assessment?: AssessmentResponseDto | null;
  decision?: DecisionResponseDto | null;
  payment?: FeePaymentResponseDto | null;
}

export type ApplicationRecord = Admission &
  ApplicationItem & {
    applicationNumber?: string;
    applicantName?: string;
    gradeApplyingFor?: string;
    submissionDate?: string;
    assessmentScore?: number;
    feePaidAmount?: number;
    [key: string]: any;
  };

export interface ApplicationsResponse {
  data: ApplicationRecord[];
  items?: ApplicationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApplicationQueryParams {
  searchText?: string;
  search?: string;
  status?: string;
  academic_year_id?: string;
  grade_id?: string;
  org_id?: string;
  school_id?: string;
  created_by?: string;
  mine?: boolean | string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

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
    getApplications: builder.query<ApplicationsResponse, ApplicationQueryParams | void>({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.APPLICATIONS,
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        if (response && Array.isArray(response.data) && response.meta) {
          return response as ApplicationsResponse;
        }
        if (response && Array.isArray(response.data)) {
          return {
            data: response.data,
            total: response.total ?? response.data.length,
            page: response.page ?? 1,
            pageSize: response.pageSize ?? response.data.length,
            totalPages: response.totalPages ?? 1,
            hasNextPage: !!response.hasNextPage,
            hasPrevPage: !!response.hasPrevPage,
            meta: response.meta || {
              total: response.total ?? response.data.length,
              page: response.page ?? 1,
              pageSize: response.pageSize ?? response.data.length,
              totalPages: response.totalPages ?? 1,
              hasNextPage: !!response.hasNextPage,
              hasPrevPage: !!response.hasPrevPage,
            },
          };
        }
        if (Array.isArray(response)) {
          return {
            data: response,
            total: response.length,
            page: 1,
            pageSize: response.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            meta: {
              total: response.length,
              page: 1,
              pageSize: response.length,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          };
        }
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          meta: {
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, application_id }) => ({
                type: 'Application' as const,
                id: application_id || id,
              })),
              { type: 'Application', id: 'LIST' },
            ]
          : [{ type: 'Application', id: 'LIST' }],
    }),
    getApplicationById: builder.query<ApplicationRecord, string>({
      query: (id: string) => ENDPOINTS.ADMISSIONS.APPLICATION_BY_ID(id),
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    updateApplicationStatus: builder.mutation<
      ApplicationRecord,
      { id: string; status: string; remarks?: string }
    >({
      query: ({ id, status, remarks }) => ({
        url: `${ENDPOINTS.ADMISSIONS.APPLICATION_BY_ID(id)}/status`,
        method: 'PATCH',
        body: { status, remarks },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),
    updateApplication: builder.mutation<
      ApplicationRecord,
      { id: string; body: Partial<ApplicationRecord> }
    >({
      query: ({ id, body }) => ({
        url: ENDPOINTS.ADMISSIONS.APPLICATION_BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),
    deleteApplication: builder.mutation<{ success: boolean }, string>({
      query: (id: string) => ({
        url: ENDPOINTS.ADMISSIONS.APPLICATION_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
    }),
    getApplicationDashboard: builder.query<any, void>({
      query: () => '/v1/applications/dashboard',
      providesTags: [{ type: 'Application', id: 'DASHBOARD' }],
    }),
    getDocumentTypes: builder.query<
      DocumentTypeDto[],
      { application_id?: string; org_id?: string } | void
    >({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.DOCUMENT_TYPES,
        params: params || undefined,
      }),
    }),
    getApplicationDocuments: builder.query<DocumentResponseDto[], string>({
      query: (applicationId: string) => ENDPOINTS.ADMISSIONS.DOCUMENTS(applicationId),
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    getDocumentSignedUrl: builder.query<SignedUrlResponseDto, string>({
      query: (documentId: string) => ENDPOINTS.ADMISSIONS.DOCUMENT_SIGNED_URL(documentId),
    }),
    verifyAdmissionDocument: builder.mutation<
      any,
      {
        documentId: string;
        applicationId?: string;
        verify_status: 'verified' | 'rejected' | 'resubmission_requested' | 'pending';
        verification_remarks?: string | null;
      }
    >({
      query: ({ documentId, verify_status, verification_remarks }) => ({
        url: ENDPOINTS.ADMISSIONS.DOCUMENT_VERIFY(documentId),
        method: 'PATCH',
        body: { verify_status, verification_remarks },
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Application', id: 'LIST' },
        ...(applicationId
          ? [{ type: 'Application' as const, id: applicationId }]
          : [{ type: 'Application' as const }]),
      ],
    }),
    uploadAdmissionDocument: builder.mutation<any, { applicationId: string; formData: FormData }>({
      query: ({ applicationId, formData }) => ({
        url: ENDPOINTS.ADMISSIONS.DOCUMENTS(applicationId),
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'Application', id: 'LIST' },
      ],
    }),
    deleteAdmissionDocument: builder.mutation<any, { documentId: string; applicationId?: string }>({
      query: ({ documentId }) => ({
        url: ENDPOINTS.ADMISSIONS.DOCUMENT_DELETE(documentId),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Application', id: 'LIST' },
        ...(applicationId ? [{ type: 'Application' as const, id: applicationId }] : []),
      ],
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
    getApplicationFee: builder.query<ApplicationFeeDetailsDto, string>({
      query: (applicationId: string) => ENDPOINTS.ADMISSIONS.FEE_INFO(applicationId),
      providesTags: (_result, _error, id) => [
        { type: 'Application', id },
        { type: 'FeePayment', id },
      ],
    }),
    recordApplicationPayment: builder.mutation<any, RecordApplicationPaymentPayload>({
      query: ({ applicationId, ...body }) => ({
        url: ENDPOINTS.ADMISSIONS.PAYMENT(applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'Application', id: 'LIST' },
        { type: 'FeePayment', id: applicationId },
      ],
    }),
    getApplicationReceipt: builder.query<FeeReceiptDto, string>({
      query: (applicationId: string) => ENDPOINTS.ADMISSIONS.RECEIPT(applicationId),
      providesTags: (_result, _error, id) => [{ type: 'FeePayment', id }],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useGetApplicationByIdQuery,
  useUpdateApplicationStatusMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useGetApplicationDashboardQuery,
  useGetDocumentTypesQuery,
  useGetApplicationDocumentsQuery,
  useLazyGetDocumentSignedUrlQuery,
  useVerifyAdmissionDocumentMutation,
  useUploadAdmissionDocumentMutation,
  useDeleteAdmissionDocumentMutation,
  useVerifyDocumentMutation,
  useRecordAssessmentMutation,
  useMakeDecisionMutation,
  useCollectFeeMutation,
  useGetApplicationFeeQuery,
  useLazyGetApplicationFeeQuery,
  useRecordApplicationPaymentMutation,
  useGetApplicationReceiptQuery,
  useLazyGetApplicationReceiptQuery,
} = admissionApi;
