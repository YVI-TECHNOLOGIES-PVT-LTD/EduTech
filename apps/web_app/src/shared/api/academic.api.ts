import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface AcademicYearRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  academic_year_id?: string;
  academic_year_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface GradeRecord {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  grade_id?: string;
  grade_name?: string;
  grade_code?: string;
  display_order?: number;
}

export interface SectionRecord {
  id: string;
  name: string;
  gradeId: string;
  capacity: number;
  section_id?: string;
  section_name?: string;
  grade_id?: string;
}

export const academicApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicYears: builder.query<AcademicYearRecord[], void>({
      query: () => ENDPOINTS.ACADEMICS.YEARS,
      providesTags: ['AcademicYear'],
      transformResponse: (response: any): AcademicYearRecord[] => {
        const rawList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.items)
              ? response.items
              : [];
        return rawList.map((ay: any) => ({
          id: ay.id || ay.academic_year_id,
          academic_year_id: ay.academic_year_id || ay.id,
          name: ay.name || ay.academic_year_name || 'Academic Year',
          academic_year_name: ay.academic_year_name || ay.name || 'Academic Year',
          startDate: ay.startDate || ay.start_date || '',
          endDate: ay.endDate || ay.end_date || '',
          start_date: ay.start_date || ay.startDate || '',
          end_date: ay.end_date || ay.endDate || '',
          isCurrent: Boolean(ay.isCurrent || ay.status === 'ACTIVE'),
          status: (['ACTIVE', 'UPCOMING', 'CLOSED'].includes(ay.status) ? ay.status : 'ACTIVE') as
            'ACTIVE' | 'UPCOMING' | 'CLOSED',
          ...ay,
        }));
      },
    }),
    getGrades: builder.query<GradeRecord[], void>({
      query: () => ENDPOINTS.ACADEMICS.GRADES,
      providesTags: ['Grade'],
      transformResponse: (response: any): GradeRecord[] => {
        const rawList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.items)
              ? response.items
              : [];
        return rawList.map((g: any) => ({
          id: g.id || g.grade_id,
          grade_id: g.grade_id || g.id,
          name: g.name || g.grade_name || 'Grade',
          grade_name: g.grade_name || g.name || 'Grade',
          code: g.code || g.grade_code || '',
          grade_code: g.grade_code || g.code || '',
          displayOrder: g.displayOrder ?? g.display_order ?? 0,
          display_order: g.display_order ?? g.displayOrder ?? 0,
          ...g,
        }));
      },
    }),
    getSections: builder.query<SectionRecord[], void>({
      query: () => ENDPOINTS.ACADEMICS.SECTIONS,
      providesTags: ['Section'],
      transformResponse: (response: any): SectionRecord[] => {
        const rawList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.items)
              ? response.items
              : [];
        return rawList.map((s: any) => ({
          id: s.id || s.section_id,
          section_id: s.section_id || s.id,
          name: s.name || s.section_name || 'Section',
          section_name: s.section_name || s.name || 'Section',
          gradeId: s.gradeId || s.grade_id,
          grade_id: s.grade_id || s.gradeId,
          capacity: s.capacity ?? 0,
          ...s,
        }));
      },
    }),
  }),
});

export const { useGetAcademicYearsQuery, useGetGradesQuery, useGetSectionsQuery } = academicApi;
