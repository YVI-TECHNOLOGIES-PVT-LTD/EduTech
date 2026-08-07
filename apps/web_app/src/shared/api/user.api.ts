import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';
import { ApiBuilder } from '@/types/rtk-query';

export interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  passwordHash: string;
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder: ApiBuilder) => ({
    getUsers: builder.query<UserRecord[], void>({
      query: () => ENDPOINTS.USERS.BASE,
      providesTags: ['User'],
    }),
    createUser: builder.mutation<UserRecord, CreateUserPayload>({
      query: (body: CreateUserPayload) => ({
        url: ENDPOINTS.USERS.BASE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    getRoles: builder.query<RoleRecord[], void>({
      query: () => ENDPOINTS.USERS.ROLES,
      providesTags: ['Role'],
    }),
    updateRolePermissions: builder.mutation<RoleRecord, { roleId: string; permissions: string[] }>({
      query: ({ roleId, permissions }) => ({
        url: `/users/roles/${roleId}/permissions`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: ['Role', 'User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useGetRolesQuery,
  useUpdateRolePermissionsMutation,
} = userApi;
