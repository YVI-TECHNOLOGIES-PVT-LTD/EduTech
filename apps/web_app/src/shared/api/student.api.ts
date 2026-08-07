import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';
import { ApiBuilder } from '@/types/rtk-query';

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
  endpoints: (builder: ApiBuilder) => ({
    getStudents: builder.query<StudentRecord[], void>({
      query: () => ENDPOINTS.STUDENTS.DIRECTORY,
      providesTags: ['Student'],
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
  }),
});

export const { useGetStudentsQuery, useGetParentsQuery, useEnrollStudentMutation } = studentApi;
