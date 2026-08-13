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
    getLeads: builder.query<any, any>({
      query: (params?: any) => ({
        url: ENDPOINTS.CRM.LEADS,
        params,
      }),
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
    assignLead: builder.mutation<any, { leadId: string; counselor_id: string; remarks?: string }>({
      query: ({ leadId, counselor_id, remarks }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${leadId}/assign`,
        method: 'PATCH',
        body: { assigned_counsellor_id: counselor_id, remarks },
      }),
      invalidatesTags: ['Lead'],
    }),
    qualifyLead: builder.mutation<any, string>({
      query: (leadId: string) => ({
        url: ENDPOINTS.CRM.QUALIFY(leadId),
        method: 'POST',
      }),
      invalidatesTags: ['Lead'],
    }),
    convertLead: builder.mutation<any, string>({
      query: (leadId: string) => ({
        url: ENDPOINTS.CRM.CONVERT(leadId),
        method: 'POST',
      }),
      invalidatesTags: ['Lead'],
    }),
    getCampusVisits: builder.query<any, any>({
      query: (params?: any) => ({
        url: ENDPOINTS.CRM.CAMPUS_VISITS,
        params,
      }),
      providesTags: ['CampusVisit'],
    }),
    scheduleVisit: builder.mutation<
      any,
      {
        lead_id: string;
        visit_type: 'campus' | 'virtual';
        scheduled_at: string;
        staff_id?: string;
        remarks?: string;
      }
    >({
      query: (body) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${body.lead_id}/visits`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CampusVisit', 'Lead'],
    }),
    updateVisitStatus: builder.mutation<any, { visitId: string; status: string; remarks?: string }>(
      {
        query: ({ visitId, status, remarks }) => ({
          url: `${ENDPOINTS.CRM.CAMPUS_VISITS}/${visitId}`,
          method: 'PATCH',
          body: { status, remarks },
        }),
        invalidatesTags: ['CampusVisit', 'Lead'],
      },
    ),
  }),
});

export const {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useAssignLeadMutation,
  useQualifyLeadMutation,
  useConvertLeadMutation,
  useGetCampusVisitsQuery,
  useScheduleVisitMutation,
  useUpdateVisitStatusMutation,
} = crmApi;
