import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface StudentRecord {
  id: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  parentName: string;
  parentPhone: string;
  status: 'ACTIVE' | 'ENROLLED' | 'WITHDRAWN';
  enrollmentDate: string;
  [key: string]: any;
}

export interface ParentRecord {
  id: string;
  name: string;
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  email: string;
  phone: string;
  occupation?: string;
}

export interface EnrollStudentPayload {
  applicationId: string;
  gradeId: string;
  sectionId: string;
  academicYearId: string;
  rollNumber?: string;
}

export interface ApprovedApplicationRecord {
  application_id: string;
  application_number: string;
  org_id: string;
  academic_year_id: string;
  academic_year_name?: string;
  status: string;
  created_at: string;
  student_name: string;
  student_first_name: string;
  student_last_name?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  contact_relationship: string;
  grade_name: string;
  academic_year_grade_id: string;
  available_sections: Array<{
    section_id: string;
    section_name: string;
    capacity?: number;
    room_no?: string;
  }>;
  decision_status?: string | null;
  decision_date?: string | null;
  scholarship_percentage?: number | null;
  offer_expiry_date?: string | null;
  payment_status?: string;
  is_fee_paid: boolean;
  is_decision_approved: boolean;
  is_eligible_for_enrollment: boolean;
  is_enrolled: boolean;
  student?: any;
}

export interface ConvertApplicationPayload {
  applicationId: string;
  section_id?: string;
  roll_number?: string;
  remarks?: string;
}

export interface ConvertApplicationResponse {
  success: boolean;
  is_existing: boolean;
  student: any;
  enrollment?: any;
}

export const studentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<StudentRecord[], Record<string, any> | void>({
      query: (params: Record<string, any> | void) => ({
        url: ENDPOINTS.STUDENTS.DIRECTORY,
        params: params || undefined,
      }),
      providesTags: ['Student'],
    }),
    getApprovedApplications: builder.query<ApprovedApplicationRecord[], { search?: string } | void>(
      {
        query: (params) => ({
          url: ENDPOINTS.STUDENTS.APPROVED_APPLICATIONS,
          params: params || undefined,
        }),
        providesTags: ['Application', 'Student'],
      },
    ),
    convertApplicationToStudent: builder.mutation<
      ConvertApplicationResponse,
      ConvertApplicationPayload
    >({
      query: ({ applicationId, ...body }) => ({
        url: ENDPOINTS.STUDENTS.CONVERT_APPLICATION(applicationId),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Student', 'Application', 'Lead'],
    }),
    getStudentById: builder.query<StudentRecord, string>({
      query: (id: string) => `/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),
    getParents: builder.query<ParentRecord[], string | void>({
      query: (studentId?: string | void) =>
        studentId ? ENDPOINTS.STUDENTS.PARENTS(studentId) : '/v1/parents',
      providesTags: ['Parent'],
    }),
    enrollStudent: builder.mutation<StudentRecord, EnrollStudentPayload>({
      query: (body: EnrollStudentPayload) => ({
        url: ENDPOINTS.STUDENTS.CONVERT_APPLICATION(body.applicationId),
        method: 'POST',
        body: {
          section_id: body.sectionId,
          roll_number: body.rollNumber,
        },
      }),
      invalidatesTags: ['Student', 'Application', 'Lead'],
    }),
    registerStudent: builder.mutation<StudentRecord, any>({
      query: (data: any) => ({
        url: '/students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Student'],
    }),
    updateStudentProfile: builder.mutation<StudentRecord, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/students/${id}/profile`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Student', { type: 'Student', id }],
    }),
    updateStudentParents: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/students/${id}/parents`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Student', { type: 'Student', id }, 'Parent'],
    }),
    promoteStudent: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/students/${id}/promote`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Student', { type: 'Student', id }],
    }),
    bulkPromoteStudents: builder.mutation<any, any>({
      query: (data: any) => ({
        url: '/admin/students/promote',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Student'],
    }),
    requestStudentTransfer: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/students/${id}/transfer`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Student', { type: 'Student', id }],
    }),
    approveStudentTransfer: builder.mutation<any, string>({
      query: (requestId: string) => ({
        url: `/students/transfer/approve/${requestId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Student'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetApprovedApplicationsQuery,
  useConvertApplicationToStudentMutation,
  useGetStudentByIdQuery,
  useGetParentsQuery,
  useEnrollStudentMutation,
  useRegisterStudentMutation,
  useUpdateStudentProfileMutation,
  useUpdateStudentParentsMutation,
  usePromoteStudentMutation,
  useBulkPromoteStudentsMutation,
  useRequestStudentTransferMutation,
  useApproveStudentTransferMutation,
} = studentApi;
