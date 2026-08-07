import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';
import { ApiBuilder } from '@/types/rtk-query';

export interface OrganizationProfile {
  id: string;
  name: string;
  legalName?: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    headerTitle?: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    academicYearId?: string;
  };
}

export interface UpdateOrganizationRequest {
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
}

export const organizationApi = apiSlice.injectEndpoints({
  endpoints: (builder: ApiBuilder) => ({
    getOrganizationProfile: builder.query<OrganizationProfile, void>({
      query: () => ENDPOINTS.ORGANIZATION.PROFILE,
      providesTags: ['Organization'],
    }),
    updateOrganizationProfile: builder.mutation<OrganizationProfile, UpdateOrganizationRequest>({
      query: (body: UpdateOrganizationRequest) => ({
        url: ENDPOINTS.ORGANIZATION.UPDATE,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Organization'],
    }),
  }),
});

export const { useGetOrganizationProfileQuery, useUpdateOrganizationProfileMutation } =
  organizationApi;
