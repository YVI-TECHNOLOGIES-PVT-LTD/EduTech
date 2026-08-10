import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  staffCount: number;
}

export interface DesignationRecord {
  id: string;
  title: string;
  code: string;
  departmentId?: string;
}

export interface StaffRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'OFFBOARDED';
}

export const staffApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<DepartmentRecord[], void>({
      query: () => ENDPOINTS.HR.DEPARTMENTS,
      providesTags: ['Department'],
    }),
    getDesignations: builder.query<DesignationRecord[], void>({
      query: () => ENDPOINTS.HR.DESIGNATIONS,
      providesTags: ['Designation'],
    }),
    getStaffList: builder.query<StaffRecord[], void>({
      query: () => ENDPOINTS.HR.STAFF,
      providesTags: ['Staff'],
    }),
  }),
});

export const { useGetDepartmentsQuery, useGetDesignationsQuery, useGetStaffListQuery } = staffApi;
