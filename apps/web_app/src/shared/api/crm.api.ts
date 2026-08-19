import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export type LeadSource =
  | 'website'
  | 'walk_in'
  | 'referral'
  | 'social_media'
  | 'chatbot'
  | 'qr_code'
  | 'education_fair'
  | 'phone_call'
  | 'email'
  | 'other';

export type LeadStage =
  | 'enquiry_received'
  | 'qualified'
  | 'counselling_scheduled'
  | 'campus_visit'
  | 'application_submitted'
  | 'document_verification'
  | 'assessment'
  | 'admission_approved'
  | 'waitlisted'
  | 'rejected'
  | 'fee_payment_pending'
  | 'enrolled';

export type LeadPriority = 'hot' | 'warm' | 'cold';
export type GenderType = 'male' | 'female' | 'other' | 'undisclosed';
export type RelationshipType = 'father' | 'mother' | 'guardian' | 'grandparent' | 'other';
export type ActivityType =
  | 'phone_call'
  | 'email'
  | 'whatsapp'
  | 'chatbot'
  | 'follow_up'
  | 'counselling'
  | 'application_submitted'
  | 'note';
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled';
export type VisitType = 'campus' | 'virtual';
export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface CounselorSummary {
  staff_id: string;
  employee_code?: string;
  name?: string;
  email?: string | null;
}

export interface LeadItem {
  lead_id: string;
  id: string;
  org_id: string;
  lead_number: string;
  academic_year_grade_id: string;
  grade_name?: string | null;
  academic_year_name?: string | null;
  grade_id?: string | null;
  academic_year_id?: string | null;
  grade?: { grade_id: string; grade_name: string } | null;
  academic_year?: { academic_year_id: string; academic_year_name: string } | null;
  student_first_name: string;
  student_last_name?: string | null;
  student_name: string;
  dob?: string | null;
  gender?: GenderType | null;
  curriculum_preference?: string | null;
  scholarship_interest?: boolean;
  contact_name: string;
  parent_name?: string;
  contact_relationship?: RelationshipType | null;
  contact_phone: string;
  parent_phone?: string;
  contact_email?: string | null;
  parent_email?: string | null;
  source: LeadSource;
  stage: LeadStage;
  status?: string;
  priority?: LeadPriority | null;
  ai_lead_score?: number | null;
  assigned_counsellor_id?: string | null;
  counselor_id?: string | null;
  counselor?: CounselorSummary | null;
  remarks?: string | null;
  enquiry_date: string;
  created_at: string;
  updated_at: string;
}

export interface SearchLeadParams {
  searchText?: string;
  stage?: LeadStage | string;
  status?: LeadStage | string;
  source?: LeadSource | string;
  priority?: LeadPriority | string;
  assigned_counsellor_id?: string;
  assignedTo?: string;
  academic_year_grade_id?: string;
  academic_year_id?: string;
  grade_id?: string;
  org_id?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedLeadsResponse {
  data: LeadItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LeadActivityItem {
  activity_id: string;
  lead_id: string;
  activity_type: ActivityType;
  activity_date: string;
  status: ActivityStatus;
  next_followup_date?: string | null;
  notes?: string | null;
  created_at: string;
  users_lead_activities_created_byTousers?: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
}

export interface LeadVisitItem {
  visit_id: string;
  lead_id: string;
  visit_type: VisitType;
  scheduled_at: string;
  staff_id?: string | null;
  status: VisitStatus;
  meeting_link?: string | null;
  remarks?: string | null;
  created_at: string;
  staff?: {
    staff_id: string;
    employee_code: string;
    users_staff_user_idTousers?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  } | null;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  count: number;
  matches: Array<{
    lead_id: string;
    id: string;
    lead_number: string;
    student_name: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string | null;
    created_at: string;
  }>;
}

export const crmApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<PaginatedLeadsResponse, SearchLeadParams | void>({
      query: (params) => ({
        url: ENDPOINTS.CRM.LEADS,
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ lead_id }) => ({ type: 'Lead' as const, id: lead_id })),
              { type: 'Lead', id: 'LIST' },
            ]
          : [{ type: 'Lead', id: 'LIST' }],
    }),

    getLeadById: builder.query<LeadItem, string>({
      query: (id) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Lead', id }],
    }),

    createLead: builder.mutation<LeadItem, Partial<LeadItem>>({
      query: (body) => ({
        url: ENDPOINTS.CRM.LEADS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Lead', id: 'LIST' }],
    }),

    updateLead: builder.mutation<LeadItem, { id: string; data: Partial<LeadItem> }>({
      query: ({ id, data }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),

    deleteLead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),

    updateLeadStatus: builder.mutation<LeadItem, { id: string; stage: string; remarks?: string }>({
      query: ({ id, stage, remarks }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${id}/status`,
        method: 'PATCH',
        body: { stage, remarks },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),

    assignLead: builder.mutation<
      LeadItem,
      { id: string; assigned_counsellor_id: string; remarks?: string }
    >({
      query: ({ id, assigned_counsellor_id, remarks }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${id}/assign`,
        method: 'PATCH',
        body: { assigned_counsellor_id, remarks },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),

    convertLeadToApplication: builder.mutation<any, string>({
      query: (leadId: string) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${leadId}/convert`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, leadId) => [
        { type: 'Lead', id: leadId },
        { type: 'Lead', id: 'LIST' },
        { type: 'Application', id: 'LIST' },
      ],
    }),

    getLeadActivities: builder.query<LeadActivityItem[], string>({
      query: (leadId) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${leadId}/activities`,
      }),
      providesTags: (_result, _error, leadId) => [
        { type: 'LeadActivity' as const, id: `LEAD_${leadId}` },
      ],
    }),

    createLeadActivity: builder.mutation<
      LeadActivityItem,
      { leadId: string; data: Partial<LeadActivityItem> }
    >({
      query: ({ leadId, data }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${leadId}/activities`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'LeadActivity', id: `LEAD_${leadId}` },
        { type: 'Lead', id: leadId },
      ],
    }),

    updateLeadActivity: builder.mutation<
      LeadActivityItem,
      { activityId: string; leadId: string; data: Partial<LeadActivityItem> }
    >({
      query: ({ activityId, data }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/activities/${activityId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'LeadActivity', id: `LEAD_${leadId}` },
      ],
    }),

    deleteLeadActivity: builder.mutation<{ success: boolean }, { activityId: string; leadId: string }>({
      query: ({ activityId }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/activities/${activityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'LeadActivity', id: `LEAD_${leadId}` },
      ],
    }),

    getLeadVisits: builder.query<LeadVisitItem[], string>({
      query: (leadId) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${leadId}/visits`,
      }),
      providesTags: (_result, _error, leadId) => [
        { type: 'CampusVisit' as const, id: `LEAD_${leadId}` },
      ],
    }),

    scheduleVisit: builder.mutation<
      LeadVisitItem,
      {
        lead_id: string;
        visit_type: VisitType;
        scheduled_at: string;
        staff_id?: string | null;
        meeting_link?: string | null;
        remarks?: string | null;
      }
    >({
      query: (body) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${body.lead_id}/visits`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { lead_id }) => [
        { type: 'CampusVisit', id: `LEAD_${lead_id}` },
        { type: 'LeadActivity', id: `LEAD_${lead_id}` },
        { type: 'Lead', id: lead_id },
      ],
    }),

    updateVisitStatus: builder.mutation<
      LeadVisitItem,
      {
        visitId: string;
        leadId: string;
        status?: VisitStatus;
        scheduled_at?: string;
        staff_id?: string | null;
        meeting_link?: string | null;
        remarks?: string | null;
      }
    >({
      query: ({ visitId, ...body }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/visits/${visitId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'CampusVisit', id: `LEAD_${leadId}` },
        { type: 'LeadActivity', id: `LEAD_${leadId}` },
        { type: 'Lead', id: leadId },
      ],
    }),

    deleteVisit: builder.mutation<{ success: boolean }, { visitId: string; leadId: string }>({
      query: ({ visitId }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/visits/${visitId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'CampusVisit', id: `LEAD_${leadId}` },
        { type: 'Lead', id: leadId },
      ],
    }),

    getCampusVisits: builder.query<any, any>({
      query: (params) => ({
        url: ENDPOINTS.CRM.CAMPUS_VISITS,
        params,
      }),
      providesTags: ['CampusVisit'],
    }),

    checkDuplicates: builder.query<
      DuplicateCheckResponse,
      { phone: string; email?: string; name?: string }
    >({
      query: (params) => ({
        url: `${ENDPOINTS.CRM.LEADS}/check-duplicates`,
        params,
      }),
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useConvertLeadToApplicationMutation,
  useGetLeadActivitiesQuery,
  useCreateLeadActivityMutation,
  useUpdateLeadActivityMutation,
  useDeleteLeadActivityMutation,
  useGetLeadVisitsQuery,
  useGetCampusVisitsQuery,
  useScheduleVisitMutation,
  useUpdateVisitStatusMutation,
  useDeleteVisitMutation,
  useLazyCheckDuplicatesQuery,
} = crmApi;
