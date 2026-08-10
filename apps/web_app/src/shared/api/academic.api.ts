import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface AcademicYearRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
}

export interface GradeRecord {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
}

export interface SectionRecord {
  id: string;
  name: string;
  gradeId: string;
  capacity: number;
}

export const academicApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicYears: builder.query<AcademicYearRecord[], void>({
      query: () => ENDPOINTS.ACADEMICS.YEARS,
      providesTags: ['AcademicYear'],
    }),
    getGrades: builder.query<GradeRecord[], void>({
      query: () => ENDPOINTS.ACADEMICS.GRADES,
      providesTags: ['Grade'],
    }),
    getSections: builder.query<SectionRecord[], void>({
      query: () => ENDPOINTS.ACADEMICS.SECTIONS,
      providesTags: ['Section'],
    }),
  }),
});

export const { useGetAcademicYearsQuery, useGetGradesQuery, useGetSectionsQuery } = academicApi;
