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

export const studentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<StudentRecord[], Record<string, any> | void>({
      query: (params: Record<string, any> | void) => ({
        url: ENDPOINTS.STUDENTS.DIRECTORY,
        params: params || undefined,
      }),
      providesTags: ['Student'],
    }),
    getStudentById: builder.query<StudentRecord, string>({
      query: (id: string) => `/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),
    getParents: builder.query<ParentRecord[], void>({
      query: () => ENDPOINTS.STUDENTS.PARENTS,
      providesTags: ['Parent'],
    }),
    enrollStudent: builder.mutation<StudentRecord, EnrollStudentPayload>({
      query: (body: EnrollStudentPayload) => ({
        url: ENDPOINTS.STUDENTS.ENROLL,
        method: 'POST',
        body,
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
