import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface LeadRecord {
  id: string;
  leadNumber: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  gradeApplyingFor: string;
  status: string;
  source: string;
  aiScore?: number;
  createdAt: string;
  student_name?: string;
  inquiry_number?: string;
  grade_applied_for?: string;
  assigned_counselor_id?: string;
  assigned_counselor?: string;
  priority?: string;
  score?: number;
}

export interface CampusVisitRecord {
  id: string;
  leadId: string;
  visitorName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  counsellorName: string;
}

export interface CreateLeadPayload {
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  gradeApplyingFor: string;
  source?: string;
}

export const crmApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<LeadRecord[], void>({
      query: () => ENDPOINTS.CRM.LEADS,
      providesTags: ['Lead'],
    }),
    createLead: builder.mutation<LeadRecord, CreateLeadPayload>({
      query: (body: CreateLeadPayload) => ({
        url: ENDPOINTS.CRM.LEADS,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Lead'],
    }),
    getCampusVisits: builder.query<CampusVisitRecord[], void>({
      query: () => ENDPOINTS.CRM.CAMPUS_VISITS,
      providesTags: ['CampusVisit'],
    }),
  }),
});

export const { useGetLeadsQuery, useCreateLeadMutation, useGetCampusVisitsQuery } = crmApi;
