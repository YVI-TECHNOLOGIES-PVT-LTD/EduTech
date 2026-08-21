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
  staff_id: string;
  user_id?: string;
  employeeId: string;
  employee_code?: string;
  firstName: string;
  lastName: string;
  first_name?: string;
  last_name?: string | null;
  name?: string;
  staff_name?: string;
  display_name?: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role?: string;
  roles?: string[];
  status: 'ACTIVE' | 'ON_LEAVE' | 'OFFBOARDED';
  is_active?: boolean;
}

export interface CounsellorOption {
  staff_id: string;
  id: string;
  user_id?: string;
  first_name: string;
  last_name?: string | null;
  firstName?: string;
  lastName?: string;
  display_name: string;
  staff_name?: string;
  name?: string;
  email: string;
  phone?: string;
  employee_code: string;
  employeeId?: string;
  role: string;
  roles?: string[];
  is_active: boolean;
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
    getStaffList: builder.query<StaffRecord[], { role?: string; search?: string } | void>({
      query: (params) => ({
        url: ENDPOINTS.HR.STAFF,
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const rawList = Array.isArray(response) ? response : response?.data || [];
        return rawList.map((item: any) => ({
          id: item.staff_id || item.id,
          staff_id: item.staff_id || item.id,
          user_id: item.user_id,
          employeeId: item.employee_code || item.employeeId || '',
          employee_code: item.employee_code || item.employeeId || '',
          firstName: item.first_name || item.firstName || '',
          lastName: item.last_name || item.lastName || '',
          first_name: item.first_name || item.firstName || '',
          last_name: item.last_name || item.lastName || '',
          name:
            item.staff_name ||
            item.display_name ||
            item.name ||
            `${item.first_name || item.firstName || ''} ${item.last_name || item.lastName || ''}`.trim(),
          staff_name:
            item.staff_name ||
            item.display_name ||
            item.name ||
            `${item.first_name || item.firstName || ''} ${item.last_name || item.lastName || ''}`.trim(),
          display_name:
            item.display_name ||
            item.staff_name ||
            item.name ||
            `${item.first_name || item.firstName || ''} ${item.last_name || item.lastName || ''}`.trim(),
          email: item.email || '',
          phone: item.phone || '',
          department: item.department || item.departments?.department_name || '',
          designation:
            item.designation || item.designation_name || item.designations?.designation_name || '',
          role: item.role || item.roles?.[0] || 'Staff',
          roles: item.roles || [],
          status: item.is_active !== false ? 'ACTIVE' : 'OFFBOARDED',
          is_active: item.is_active !== false,
        }));
      },
      providesTags: ['Staff'],
    }),
    getCounsellors: builder.query<CounsellorOption[], void>({
      query: () => ENDPOINTS.HR.STAFF_COUNSELLORS,
      transformResponse: (response: any) => {
        const rawList = Array.isArray(response) ? response : response?.data || [];
        return rawList.map((item: any) => {
          const staffId = item.staff_id || item.id;
          const firstName = item.first_name || item.firstName || '';
          const lastName = item.last_name || item.lastName || '';
          const displayName =
            item.display_name ||
            item.staff_name ||
            item.name ||
            `${firstName} ${lastName}`.trim() ||
            'Unknown Counsellor';

          return {
            staff_id: staffId,
            id: staffId,
            user_id: item.user_id,
            first_name: firstName,
            last_name: lastName,
            firstName,
            lastName,
            display_name: displayName,
            staff_name: displayName,
            name: displayName,
            email: item.email || '',
            phone: item.phone || '',
            employee_code: item.employee_code || item.employeeId || '',
            employeeId: item.employee_code || item.employeeId || '',
            role: item.role || item.roles?.[0] || 'Counsellor',
            roles: item.roles || ['Counsellor'],
            is_active: item.is_active !== false,
          };
        });
      },
      providesTags: ['Staff'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetStaffListQuery,
  useGetCounsellorsQuery,
} = staffApi;
