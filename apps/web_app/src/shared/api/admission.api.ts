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

export interface AssessmentConfigDto {
  config_id: string;
  academic_year_grade_id: string;
  assessment_required: boolean;
  assessment_mode: 'written' | 'online' | 'oral' | 'observation' | 'practical' | string;
  result_type: 'marks' | 'pass_fail' | 'recommendation' | string;
  maximum_marks: number | null;
  pass_marks: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  academic_year_grades?: {
    academic_year_grade_id: string;
    grade_id: string;
    academic_year_id: string;
    grades?: {
      grade_id: string;
      grade_name: string;
      display_order?: number;
    };
    academic_years?: {
      academic_year_id: string;
      year_name: string;
    };
  };
}

export interface SaveAssessmentConfigPayload {
  academic_year_grade_id: string;
  assessment_required?: boolean;
  assessment_mode?: string;
  result_type?: string;
  maximum_marks?: number | null;
  pass_marks?: number | null;
  is_active?: boolean;
}

export interface AssessmentAnalyticsDto {
  totalAssessed: number;
  passed: number;
  failed: number;
  recommended: number;
  notRecommended: number;
  passRate: number;
  avgPercentage: number;
  totalConfigs: number;
  modeDistribution: Record<string, number>;
}

export interface ExaminerDto {
  staff_id: string;
  user_id?: string;
  employee_code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  designation_name?: string | null;
  department_name?: string | null;
  roles?: string[];
}

export interface RecordAssessmentPayload {
  applicationId: string;
  config_id?: string | null;
  assessment_date?: string;
  maximum_marks?: number | null;
  marks_obtained?: number | null;
  score?: number;
  maxScore?: number;
  percentage?: number | null;
  result?: 'pass' | 'fail' | 'recommended' | 'not_recommended' | string | null;
  remarks?: string | null;
  evaluatorNotes?: string;
  assessed_by?: string | null;
}

export type AdmissionDecisionStatus = 'approved' | 'waitlisted' | 'rejected' | 'withdrawn';

export interface RecordDecisionPayload {
  applicationId: string;
  decision_status: AdmissionDecisionStatus;
  decision_date?: string;
  decided_by?: string | null;
  reason?: string | null;
  remarks?: string | null;
  offer_expiry_date?: string | null;
  waitlist_position?: number | null;
  scholarship_percentage?: number | null;
}

// Backward compatibility alias
export type MakeDecisionPayload = RecordDecisionPayload;

export interface CollectFeePayload {
  applicationId: string;
  amount: number;
  paymentMode: 'ONLINE' | 'CHEQUE' | 'BANK_TRANSFER' | 'CASH';
  transactionRef: string;
}

export interface ApplicationDashboardData {
  total_applications: number;
  today_applications: number;
  approved_applications: number;
  rejected_applications: number;
  pending_documents: number;
  pending_assessments: number;
  pending_payments: number;
  applications_by_status: Record<string, number>;
}

export const admissionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getApplications: builder.query<ApplicationsResponse, ApplicationQueryParams | void>({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.APPLICATIONS,
        params: params || undefined,
      }),
      transformResponse: (response: any): ApplicationsResponse => {
        let items: ApplicationRecord[] = [];
        let total = 0;
        let page = 1;
        let pageSize = 20;
        let totalPages = 1;
        let hasNextPage = false;
        let hasPrevPage = false;
        let meta: any = null;

        if (Array.isArray(response)) {
          items = response;
          total = items.length;
          pageSize = items.length || 20;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (Array.isArray(response.items)) {
            items = response.items;
          } else if (Array.isArray(response.applications)) {
            items = response.applications;
          } else if (response.data && typeof response.data === 'object') {
            if (Array.isArray(response.data.items)) {
              items = response.data.items;
            } else if (Array.isArray(response.data.data)) {
              items = response.data.data;
            } else if (Array.isArray(response.data.applications)) {
              items = response.data.applications;
            }
          }

          total =
            typeof response.total === 'number'
              ? response.total
              : typeof response.meta?.total === 'number'
                ? response.meta.total
                : typeof response.data?.total === 'number'
                  ? response.data.total
                  : items.length;

          page =
            typeof response.page === 'number'
              ? response.page
              : typeof response.meta?.page === 'number'
                ? response.meta.page
                : 1;

          pageSize =
            typeof response.pageSize === 'number'
              ? response.pageSize
              : typeof response.meta?.pageSize === 'number'
                ? response.meta.pageSize
                : items.length || 20;

          totalPages =
            typeof response.totalPages === 'number'
              ? response.totalPages
              : typeof response.meta?.totalPages === 'number'
                ? response.meta.totalPages
                : pageSize > 0
                  ? Math.max(1, Math.ceil(total / pageSize))
                  : 1;

          hasNextPage = Boolean(
            response.hasNextPage ?? response.meta?.hasNextPage ?? page < totalPages,
          );
          hasPrevPage = Boolean(response.hasPrevPage ?? response.meta?.hasPrevPage ?? page > 1);

          meta = response.meta || {
            total,
            page,
            pageSize,
            totalPages,
            hasNextPage,
            hasPrevPage,
          };
        }

        return {
          data: items,
          items,
          total,
          page,
          pageSize,
          totalPages,
          hasNextPage,
          hasPrevPage,
          meta: meta || {
            total,
            page,
            pageSize,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        };
      },
      providesTags: (result) =>
        Array.isArray(result?.data)
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
    getApplicationDashboard: builder.query<ApplicationDashboardData, void>({
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
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        if (Array.isArray(response?.document_types)) return response.document_types;
        return [];
      },
      providesTags: [{ type: 'Application', id: 'DOCUMENT_TYPES' }],
    }),
    getApplicationDocuments: builder.query<DocumentResponseDto[], string>({
      query: (applicationId: string) => ENDPOINTS.ADMISSIONS.DOCUMENTS(applicationId),
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        if (Array.isArray(response?.documents)) return response.documents;
        return [];
      },
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
    recordAssessment: builder.mutation<AssessmentResponseDto, RecordAssessmentPayload>({
      query: ({ applicationId, score, maxScore, evaluatorNotes, ...body }) => ({
        url: ENDPOINTS.ADMISSIONS.ASSESSMENT(applicationId),
        method: 'POST',
        body: {
          maximum_marks: body.maximum_marks ?? maxScore,
          marks_obtained: body.marks_obtained ?? score,
          remarks: body.remarks ?? evaluatorNotes,
          ...body,
        },
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'Application', id: 'LIST' },
        { type: 'Application', id: 'ASSESSMENTS_LIST' },
        { type: 'Application', id: 'ASSESSMENT_ANALYTICS' },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    getApplicationAssessment: builder.query<AssessmentResponseDto | null, string>({
      query: (applicationId: string) => ENDPOINTS.ADMISSIONS.ASSESSMENT(applicationId),
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    getAssessmentConfigs: builder.query<
      { data: AssessmentConfigDto[] },
      { org_id?: string } | void
    >({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.ASSESSMENT_CONFIGS,
        params: params || undefined,
      }),
      providesTags: [{ type: 'Application', id: 'ASSESSMENT_CONFIGS' }],
    }),
    saveAssessmentConfig: builder.mutation<AssessmentConfigDto, SaveAssessmentConfigPayload>({
      query: (body) => ({
        url: ENDPOINTS.ADMISSIONS.ASSESSMENT_CONFIGS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Application', id: 'ASSESSMENT_CONFIGS' }],
    }),
    getAssessmentAnalytics: builder.query<AssessmentAnalyticsDto, { org_id?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.ASSESSMENT_ANALYTICS,
        params: params || undefined,
      }),
      providesTags: [{ type: 'Application', id: 'ASSESSMENT_ANALYTICS' }],
    }),
    getAssessmentsList: builder.query<
      any,
      {
        org_id?: string;
        academic_year_id?: string;
        grade_id?: string;
        result?: string;
        search?: string;
        page?: number;
        pageSize?: number;
      } | void
    >({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.ASSESSMENTS_LIST,
        params: params || undefined,
      }),
      providesTags: [{ type: 'Application', id: 'ASSESSMENTS_LIST' }],
    }),
    getExaminers: builder.query<{ data: ExaminerDto[] }, { org_id?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.ADMISSIONS.EXAMINERS,
        params: params || undefined,
      }),
      providesTags: [{ type: 'Staff', id: 'EXAMINERS' }],
    }),
    makeDecision: builder.mutation<DecisionResponseDto, RecordDecisionPayload>({
      query: ({ applicationId, ...body }) => ({
        url: ENDPOINTS.ADMISSIONS.DECISION(applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'Application', id: 'LIST' },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    getDecision: builder.query<DecisionResponseDto | null, string>({
      query: (applicationId: string) => ENDPOINTS.ADMISSIONS.DECISION(applicationId),
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
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
  useGetApplicationAssessmentQuery,
  useLazyGetApplicationAssessmentQuery,
  useGetAssessmentConfigsQuery,
  useSaveAssessmentConfigMutation,
  useGetAssessmentAnalyticsQuery,
  useGetAssessmentsListQuery,
  useGetExaminersQuery,
  useMakeDecisionMutation,
  useGetDecisionQuery,
  useLazyGetDecisionQuery,
  useCollectFeeMutation,
  useGetApplicationFeeQuery,
  useLazyGetApplicationFeeQuery,
  useRecordApplicationPaymentMutation,
  useGetApplicationReceiptQuery,
  useLazyGetApplicationReceiptQuery,
} = admissionApi;
