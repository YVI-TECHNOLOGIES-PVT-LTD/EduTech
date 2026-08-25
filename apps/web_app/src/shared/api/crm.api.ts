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

export type LeadPriority = 'high' | 'medium' | 'low' | 'hot' | 'warm' | 'cold';
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
  next_followup_date?: string | null;
  next_follow_up?: string | null;
  remarks?: string | null;
  academic_year_grades?: any;
  academic_year_grade?: any;
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
  total?: number;
  totalPages?: number;
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
  leads?: {
    lead_id: string;
    lead_number?: string;
    student_first_name?: string;
    student_last_name?: string | null;
    contact_name?: string;
    contact_phone?: string;
    student_name?: string;
  } | null;
  lead?: {
    lead_id?: string;
    lead_number?: string;
    student_name?: string;
    contact_phone?: string;
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
  leads?: {
    lead_id: string;
    lead_number: string;
    student_first_name: string;
    student_last_name?: string | null;
    contact_name: string;
    contact_phone: string;
    contact_email?: string | null;
    academic_year_grades?: {
      grades?: {
        grade_name: string;
      };
      academic_years?: {
        academic_year_name: string;
      };
    };
  } | null;
  lead?: {
    lead_id?: string;
    lead_number?: string;
    student_name?: string;
    student_first_name?: string;
    student_last_name?: string | null;
    contact_name?: string;
    contact_phone?: string;
  } | null;
}

export interface SearchVisitParams {
  search?: string;
  searchText?: string;
  visit_type?: VisitType | string;
  type?: string;
  status?: VisitStatus | string;
  staff_id?: string;
  counsellor_id?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface PaginatedVisitsResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: LeadVisitItem[];
  metrics?: {
    today: number;
    upcoming: number;
    completed: number;
    cancelledOrNoShow: number;
  };
}

export interface PaginatedFollowUpsResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: LeadActivityItem[];
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

export interface LeadDashboardData {
  total_leads: number;
  today_leads: number;
  qualified_leads: number;
  lost_leads: number;
  converted_leads: number;
  pending_followups: number;
  leads_by_source: Record<string, number>;
  leads_by_status: Record<string, number>;
}

export interface CounsellingMetricsData {
  today_counselling: number;
  pending_followups: number;
  unassigned_leads: number;
  hot_leads: number;
  total_leads: number;
  leads_by_priority: Record<string, number>;
  leads_by_stage: Record<string, number>;
}

export const crmApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeadDashboard: builder.query<LeadDashboardData, void>({
      query: () => `${ENDPOINTS.CRM.LEADS}/dashboard`,
      providesTags: [{ type: 'Lead', id: 'DASHBOARD' }],
    }),

    getCounsellingMetrics: builder.query<CounsellingMetricsData, void>({
      query: () => `${ENDPOINTS.CRM.LEADS}/counselling/metrics`,
      providesTags: [{ type: 'Lead', id: 'COUNSELLING_METRICS' }],
    }),

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
      invalidatesTags: [
        { type: 'Lead', id: 'LIST' },
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
      ],
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
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
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
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
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
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
      ],
    }),

    assignLead: builder.mutation<
      LeadItem,
      { id: string; assigned_counsellor_id: string | null; remarks?: string }
    >({
      query: ({ id, assigned_counsellor_id, remarks }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/${id}/assign`,
        method: 'PATCH',
        body: { assigned_counsellor_id, remarks },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
      ],
    }),

    bulkAssignLeads: builder.mutation<
      { updatedCount: number },
      { lead_ids: string[]; assigned_counsellor_id: string | null; remarks?: string }
    >({
      query: (body) => ({
        url: `${ENDPOINTS.CRM.LEADS}/bulk-assign`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'Lead', id: 'LIST' },
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
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
        { type: 'Lead', id: 'DASHBOARD' },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
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
        { type: 'LeadActivity', id: 'DUE_LIST' },
        { type: 'Lead', id: leadId },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
        { type: 'Lead', id: 'DASHBOARD' },
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
        { type: 'LeadActivity', id: 'DUE_LIST' },
        { type: 'Lead', id: leadId },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
        { type: 'Lead', id: 'DASHBOARD' },
      ],
    }),

    deleteLeadActivity: builder.mutation<
      { success: boolean },
      { activityId: string; leadId: string }
    >({
      query: ({ activityId }) => ({
        url: `${ENDPOINTS.CRM.LEADS}/activities/${activityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'LeadActivity', id: `LEAD_${leadId}` },
        { type: 'LeadActivity', id: 'DUE_LIST' },
        { type: 'Lead', id: leadId },
        { type: 'Lead', id: 'COUNSELLING_METRICS' },
        { type: 'Lead', id: 'DASHBOARD' },
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
        { type: 'CampusVisit', id: 'LIST' },
        { type: 'LeadActivity', id: `LEAD_${lead_id}` },
        { type: 'LeadActivity', id: 'DUE_LIST' },
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
        { type: 'CampusVisit', id: 'LIST' },
        { type: 'LeadActivity', id: `LEAD_${leadId}` },
        { type: 'LeadActivity', id: 'DUE_LIST' },
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
        { type: 'CampusVisit', id: 'LIST' },
        { type: 'Lead', id: leadId },
      ],
    }),

    getCampusVisits: builder.query<PaginatedVisitsResponse, SearchVisitParams | void>({
      query: (params) => ({
        url: ENDPOINTS.CRM.CAMPUS_VISITS,
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ visit_id }) => ({
                type: 'CampusVisit' as const,
                id: visit_id,
              })),
              { type: 'CampusVisit', id: 'LIST' },
            ]
          : [{ type: 'CampusVisit', id: 'LIST' }],
    }),

    getDueFollowUps: builder.query<
      PaginatedFollowUpsResponse,
      { date?: string; status?: ActivityStatus; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: `${ENDPOINTS.CRM.LEADS}/followups/due`,
        params: params || {},
      }),
      providesTags: [{ type: 'LeadActivity', id: 'DUE_LIST' }],
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
  useGetLeadDashboardQuery,
  useGetCounsellingMetricsQuery,
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useBulkAssignLeadsMutation,
  useConvertLeadToApplicationMutation,
  useGetLeadActivitiesQuery,
  useCreateLeadActivityMutation,
  useUpdateLeadActivityMutation,
  useDeleteLeadActivityMutation,
  useGetLeadVisitsQuery,
  useGetCampusVisitsQuery,
  useGetDueFollowUpsQuery,
  useScheduleVisitMutation,
  useUpdateVisitStatusMutation,
  useDeleteVisitMutation,
  useLazyCheckDuplicatesQuery,
} = crmApi;
