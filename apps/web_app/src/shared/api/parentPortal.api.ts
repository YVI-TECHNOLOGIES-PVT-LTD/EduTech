import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface ParentOrganizationMeta {
  org_id: string;
  org_name: string;
  board_affiliation: string | null;
}

export interface ParentAcademicYearMeta {
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface ChildClassTeacherDto {
  staff_id: string;
  name: string;
  email: string | null;
  designation: string | null;
}

export interface ChildEnrollmentDto {
  enrollment_id: string;
  academic_year_id: string;
  academic_year_name: string;
  academic_year_grade_id: string;
  grade_id: string;
  grade_code: string;
  grade_name: string;
  section_id: string | null;
  section_name: string | null;
  section_room_no: string | null;
  roll_number: string | null;
  enrollment_status: string;
  class_teacher: ChildClassTeacherDto | null;
}

export interface ParentChildDto {
  student_id: string;
  application_id?: string | null;
  admission_no: string | null;
  first_name: string;
  last_name: string | null;
  full_name: string;
  dob: string | null;
  gender: string | null;
  admission_date: string | null;
  status: string;
  relationship: string | null;
  is_primary_contact: boolean;
  photo_url: string | null;
  board_affiliation: string | null;
  current_enrollment: ChildEnrollmentDto | null;
  enrollment_history?: any[];
  subject_teachers?: any[];
  subjects_count?: number;
}

export interface TimetableSlotDto {
  period_number: number;
  period_name: string;
  period_type: string;
  start_time: string;
  end_time: string;
  weekday: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'break' | 'lunch' | 'scheduled' | 'free';
  is_break: boolean;
  timetable_entry_id: string | null;
  subject_id: string | null;
  subject_code: string | null;
  subject_name: string | null;
  staff_id: string | null;
  teacher_name: string | null;
  co_teachers: string[];
  classroom_id: string | null;
  classroom_label: string | null;
  building_name: string | null;
  floor_name: string | null;
  notes: string | null;
}

export interface TodayTimetableResponse {
  child_id: string;
  has_active_enrollment: boolean;
  has_section_assignment?: boolean;
  has_published_timetable: boolean;
  published_version?: {
    timetable_version_id: string;
    version_number: number;
    version_name: string | null;
    published_at: string | null;
  } | null;
  grade_name?: string | null;
  section_name?: string | null;
  academic_year_name?: string | null;
  weekday: number;
  weekday_name: string;
  date: string;
  is_working_day: boolean;
  working_weekdays?: number[];
  current_slot: TimetableSlotDto | null;
  current_class: TimetableSlotDto | null;
  next_class: TimetableSlotDto | null;
  teaching_classes_count?: number;
  slots: TimetableSlotDto[];
}

export interface WeeklyTimetableResponse {
  child_id: string;
  has_active_enrollment: boolean;
  has_section_assignment?: boolean;
  has_published_timetable: boolean;
  published_version?: {
    timetable_version_id: string;
    version_number: number;
    version_name: string | null;
    published_at: string | null;
  } | null;
  grade_name: string | null;
  section_name: string | null;
  academic_year_name: string | null;
  current_weekday: number;
  working_weekdays: number[];
  periods: Array<{
    bell_schedule_id: string;
    schedule_name: string;
    bell_schedule_period_id: string;
    period_number: number;
    period_name: string;
    period_type: string;
    start_time: string;
    end_time: string;
  }>;
  days: Array<{
    weekday: number;
    weekday_name: string;
    is_today: boolean;
    slots: TimetableSlotDto[];
  }>;
}

export interface ChildSubjectDto {
  academic_year_grade_subject_id: string;
  subject_id: string;
  subject_requirement: string;
  weekly_periods: number | null;
  theory_periods: number | null;
  practical_periods: number | null;
  display_order: number;
  subject_code: string;
  subject_name: string;
  subject_description: string | null;
  category_name: string | null;
  category_code: string | null;
  subject_selection_group_id: string | null;
  group_code: string | null;
  group_name: string | null;
  min_select: number | null;
  max_select: number | null;
  published_curriculum_count: number;
  published_resources_count: number;
  teachers: Array<{
    staff_id: string;
    teacher_name: string;
    teacher_email: string | null;
    designation_name: string | null;
    assignment_role: string;
  }>;
}

export interface ChildCurriculumResponse {
  child_id: string;
  has_active_enrollment: boolean;
  academic_year_name?: string | null;
  grade_name?: string | null;
  section_name?: string | null;
  board_affiliation: string | null;
  plans: Array<{
    curriculum_plan_id: string;
    academic_year_grade_subject_id: string;
    version_number: number;
    plan_title: string;
    plan_description: string | null;
    status: string;
    planned_start_date: string | null;
    planned_end_date: string | null;
    published_at: string | null;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    framework_code: string | null;
    framework_name: string | null;
    authority_name: string | null;
    framework_version_code: string | null;
    framework_version_name: string | null;
    units: Array<{
      curriculum_unit_id: string;
      unit_code: string | null;
      unit_title: string;
      unit_description: string | null;
      sequence_number: number;
      planned_duration_periods: number | null;
      planned_start_date: string | null;
      planned_end_date: string | null;
      schedule_state: string;
      outcomes: Array<{
        learning_outcome_id: string;
        outcome_code: string | null;
        outcome_statement: string;
        bloom_level: string | null;
        assessment_criteria: string | null;
        sequence_number: number;
      }>;
    }>;
    schedule_pacing: {
      total_units: number;
      total_outcomes: number;
      total_planned_periods: number;
      completed_units_by_schedule: number;
      in_progress_units_by_schedule: number;
      upcoming_units: number;
      scheduled_timeline_percent: number | null;
    };
  }>;
  pacing_summary: {
    published_subjects_count: number;
    total_units: number;
    total_outcomes: number;
    scheduled_completed_units: number;
    scheduled_in_progress_units: number;
    scheduled_upcoming_units: number;
    scheduled_timeline_percent: number | null;
    note?: string;
  };
  unsupported_tracking: {
    attendance: boolean;
    exam_marks: boolean;
    report_cards: boolean;
    assignment_submissions: boolean;
    verified_topic_completion: boolean;
  };
}

export interface ChildResourceDto {
  resource_id: string;
  title: string;
  description: string | null;
  resource_type: 'file' | 'external_link';
  file_name: string | null;
  file_size_bytes: string | null;
  mime_type: string | null;
  external_url: string | null;
  category_id: string | null;
  category_name: string | null;
  resource_status: string;
  allow_download: boolean;
  uploaded_by_name: string | null;
  subjects: Array<{ subject_id: string; subject_code: string; subject_name: string }>;
  tags: string[];
  created_at: string;
}

export interface ChildCalendarEntryDto {
  academic_calendar_entry_id: string;
  academic_term_id: string | null;
  term_name: string | null;
  entry_name: string;
  entry_type: 'holiday' | 'vacation' | 'exam' | 'school_event' | 'school_closure';
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  is_grade_specific: boolean;
}

export interface ParentDashboardOverviewResponse {
  organization: ParentOrganizationMeta | null;
  current_academic_year: ParentAcademicYearMeta | null;
  children: ParentChildDto[];
  selected_child_id: string | null;
  summary: {
    total_children: number;
    active_enrollments: number;
    today_classes_count: number;
    upcoming_events_count: number;
    available_resources_count: number;
    unread_notifications_count: number;
  };
  selected_child_academic: {
    child: ParentChildDto;
    today_timetable: TodayTimetableResponse;
    weekly_timetable: WeeklyTimetableResponse;
    subjects: ChildSubjectDto[];
    board_affiliation: string | null;
    curriculum_pacing: ChildCurriculumResponse['pacing_summary'];
    curriculum_plans: ChildCurriculumResponse['plans'];
    recent_resources: ChildResourceDto[];
    upcoming_calendar_entries: ChildCalendarEntryDto[];
    calendar_terms: Array<{
      academic_term_id: string;
      term_name: string;
      term_number: number;
      start_date: string;
      end_date: string;
    }>;
  } | null;
  unsupported_metrics: {
    attendance_percentage: boolean;
    exam_results: boolean;
    assignment_completion: boolean;
  };
}

function unwrapData<T>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res && 'success' in res) {
    return res.data as T;
  }
  return res as T;
}

export const parentPortalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParentDashboardOverview: builder.query<ParentDashboardOverviewResponse, string | void>({
      query: (childId) => ({
        url: ENDPOINTS.PARENT_PORTAL.DASHBOARD_OVERVIEW,
        params: childId ? { childId } : undefined,
      }),
      transformResponse: (res: any) => unwrapData<ParentDashboardOverviewResponse>(res),
      providesTags: ['ParentPortal', 'NotificationCount'],
    }),

    getParentChildren: builder.query<
      {
        organization: ParentOrganizationMeta | null;
        current_academic_year: ParentAcademicYearMeta | null;
        children: ParentChildDto[];
      },
      void
    >({
      query: () => ENDPOINTS.PARENT_PORTAL.CHILDREN,
      transformResponse: (res: any) => unwrapData(res),
      providesTags: ['ParentPortal'],
    }),

    getParentChildProfile: builder.query<
      { organization: ParentOrganizationMeta | null; child: ParentChildDto },
      string
    >({
      query: (childId) => ENDPOINTS.PARENT_PORTAL.CHILD_BY_ID(childId),
      transformResponse: (res: any) => unwrapData(res),
      providesTags: (_res, _err, childId) => [{ type: 'ParentPortal', id: childId }],
    }),

    getChildTodayTimetable: builder.query<
      TodayTimetableResponse,
      { childId: string; weekday?: number }
    >({
      query: ({ childId, weekday }) => ({
        url: ENDPOINTS.PARENT_PORTAL.TIMETABLE_TODAY(childId),
        params: weekday ? { weekday } : undefined,
      }),
      transformResponse: (res: any) => unwrapData<TodayTimetableResponse>(res),
      providesTags: (_res, _err, { childId }) => [{ type: 'ParentPortal', id: `TT-${childId}` }],
    }),

    getChildWeeklyTimetable: builder.query<WeeklyTimetableResponse, string>({
      query: (childId) => ENDPOINTS.PARENT_PORTAL.TIMETABLE_WEEKLY(childId),
      transformResponse: (res: any) => unwrapData<WeeklyTimetableResponse>(res),
      providesTags: (_res, _err, childId) => [{ type: 'ParentPortal', id: `WK-${childId}` }],
    }),

    getChildSubjects: builder.query<
      {
        child_id: string;
        has_active_enrollment: boolean;
        academic_year_name?: string | null;
        grade_name?: string | null;
        section_name?: string | null;
        board_affiliation: string | null;
        individual_elective_selection_supported: boolean;
        subjects: ChildSubjectDto[];
      },
      string
    >({
      query: (childId) => ENDPOINTS.PARENT_PORTAL.SUBJECTS(childId),
      transformResponse: (res: any) => unwrapData(res),
      providesTags: (_res, _err, childId) => [{ type: 'ParentPortal', id: `SUBJ-${childId}` }],
    }),

    getChildCurriculum: builder.query<
      ChildCurriculumResponse,
      { childId: string; subjectId?: string }
    >({
      query: ({ childId, subjectId }) => ({
        url: ENDPOINTS.PARENT_PORTAL.CURRICULUM(childId),
        params: subjectId ? { subjectId } : undefined,
      }),
      transformResponse: (res: any) => unwrapData<ChildCurriculumResponse>(res),
      providesTags: (_res, _err, { childId }) => [{ type: 'ParentPortal', id: `CURR-${childId}` }],
    }),

    getChildAcademicProgress: builder.query<
      ChildCurriculumResponse,
      { childId: string; subjectId?: string }
    >({
      query: ({ childId, subjectId }) => ({
        url: ENDPOINTS.PARENT_PORTAL.ACADEMIC_PROGRESS(childId),
        params: subjectId ? { subjectId } : undefined,
      }),
      transformResponse: (res: any) => unwrapData<ChildCurriculumResponse>(res),
      providesTags: (_res, _err, { childId }) => [{ type: 'ParentPortal', id: `PROG-${childId}` }],
    }),

    getChildResources: builder.query<
      {
        child_id: string;
        has_active_enrollment: boolean;
        grade_name?: string | null;
        section_name?: string | null;
        items: ChildResourceDto[];
        categories: Array<{ category_id: string; category_name: string }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      },
      {
        childId: string;
        subjectId?: string;
        categoryId?: string;
        resourceType?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ childId, ...params }) => ({
        url: ENDPOINTS.PARENT_PORTAL.RESOURCES(childId),
        params,
      }),
      transformResponse: (res: any) => unwrapData(res),
      providesTags: (_res, _err, { childId }) => [{ type: 'ParentPortal', id: `RES-${childId}` }],
    }),

    getChildResourcePreview: builder.query<
      { url?: string; signedUrl?: string; expiresAt?: string },
      { childId: string; resourceId: string }
    >({
      query: ({ childId, resourceId }) =>
        ENDPOINTS.PARENT_PORTAL.RESOURCE_PREVIEW(childId, resourceId),
      transformResponse: (res: any) => unwrapData(res),
    }),

    getChildResourceDownload: builder.query<
      { url?: string; signedUrl?: string; expiresAt?: string; file_name?: string },
      { childId: string; resourceId: string }
    >({
      query: ({ childId, resourceId }) =>
        ENDPOINTS.PARENT_PORTAL.RESOURCE_DOWNLOAD(childId, resourceId),
      transformResponse: (res: any) => unwrapData(res),
    }),

    getChildCalendar: builder.query<
      {
        child_id: string;
        has_active_enrollment: boolean;
        is_published: boolean;
        grade_name?: string | null;
        academic_year_name?: string | null;
        calendar: any | null;
        working_days: number[];
        terms: Array<{
          academic_term_id: string;
          term_name: string;
          term_number: number;
          start_date: string;
          end_date: string;
        }>;
        entries: ChildCalendarEntryDto[];
      },
      { childId: string; entryType?: string; fromDate?: string; toDate?: string }
    >({
      query: ({ childId, ...params }) => ({
        url: ENDPOINTS.PARENT_PORTAL.CALENDAR(childId),
        params,
      }),
      transformResponse: (res: any) => unwrapData(res),
      providesTags: (_res, _err, { childId }) => [{ type: 'ParentPortal', id: `CAL-${childId}` }],
    }),
  }),
});

export const {
  useGetParentDashboardOverviewQuery,
  useGetParentChildrenQuery,
  useGetParentChildProfileQuery,
  useGetChildTodayTimetableQuery,
  useGetChildWeeklyTimetableQuery,
  useGetChildSubjectsQuery,
  useGetChildCurriculumQuery,
  useGetChildAcademicProgressQuery,
  useGetChildResourcesQuery,
  useLazyGetChildResourcePreviewQuery,
  useLazyGetChildResourceDownloadQuery,
  useGetChildCalendarQuery,
} = parentPortalApi;
