import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export type ClassroomDeliveryMode = 'physical' | 'online' | 'hybrid';
export type ClassroomTeachingApproach = 'traditional' | 'flipped';
export type ClassroomSessionStatus =
  'scheduled' | 'in_progress' | 'completed' | 'not_conducted' | 'cancelled';
export type ClassroomAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type ClassroomParticipationMode = 'physical' | 'online';

export interface ClassroomAttendanceSummaryDto {
  enrolled_count: number;
  marked_count: number;
  unmarked_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
}

export interface ClassroomSessionDto {
  session_id: string;
  org_id: string;
  academic_year_id: string;
  academic_year_name: string;
  timetable_entry_id: string | null;
  creation_method: 'automatic' | 'manual';
  section_id: string;
  section_name: string;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  academic_year_grade_subject_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  faculty_assignment_id: string;
  teacher_staff_id: string;
  teacher_user_id: string | null;
  teacher_name: string;
  lesson_plan_id: string | null;
  lesson_title: string | null;
  classroom_id: string | null;
  classroom_name: string | null;
  classroom_code: string | null;
  session_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_at: string | null;
  actual_end_at: string | null;
  delivery_mode: ClassroomDeliveryMode;
  teaching_approach: ClassroomTeachingApproach;
  meeting_url: string | null;
  has_meeting_url: boolean;
  session_status: ClassroomSessionStatus;
  topics_covered: string | null;
  teacher_remarks: string | null;
  not_conducted_reason: string | null;
  created_at: string;
  updated_at: string;
  attendance_summary?: ClassroomAttendanceSummaryDto;
  can_join?: boolean;
  join_reason?: string | null;
  flipped_preparation?: FlippedPreparationDto | null;
  student_attendance?: {
    session_attendance_id: string;
    attendance_status: ClassroomAttendanceStatus;
    participation_mode: ClassroomParticipationMode | null;
    recorded_at: string | null;
    remarks: string | null;
  } | null;
}

export interface FlippedPreparationResourceDto {
  resource_id: string;
  title: string;
  description: string | null;
  resource_type: string;
  mime_type: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  external_url: string | null;
  preview_url: string | null;
  download_url: string | null;
  access_url: string | null;
  usage_notes: string | null;
  sequence_number: number;
}

export interface FlippedPreparationOutcomeDto {
  learning_outcome_id: string;
  outcome_code: string;
  outcome_statement: string;
  bloom_level: string | null;
  coverage_notes: string | null;
}

export interface FlippedPreparationQuestionDto {
  exit_ticket_id: string;
  prompt: string;
  expected_response_or_criteria: string | null;
  sequence_number: number;
}

export interface FlippedInClassActivityDto {
  lesson_activity_id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string | null;
  duration_minutes: number | null;
  sequence_number: number;
  materials_required: string | null;
}

export interface FlippedPostClassActivityDto {
  activity_id: string;
  title: string;
  instructions: string;
  activity_type: string;
  due_at: string;
  grading_enabled: boolean;
  maximum_marks: number | null;
  activity_status: string;
}

export interface FlippedPreparationDto {
  lesson_plan_id: string;
  curriculum_unit_id: string;
  unit_title: string | null;
  unit_code: string | null;
  lesson_title: string;
  lesson_summary: string | null;
  prerequisite_knowledge: string | null;
  planned_date: string | null;
  duration_minutes: number | null;
  teaching_approach: string | null;
  preparation_deadline: string | null;
  resources: FlippedPreparationResourceDto[];
  outcomes: FlippedPreparationOutcomeDto[];
  preparation_questions: FlippedPreparationQuestionDto[];
  in_class_activities: FlippedInClassActivityDto[];
  post_class_activities: FlippedPostClassActivityDto[];
}

export interface CreateFlippedPreparationPayload {
  curriculum_unit_id: string;
  faculty_assignment_id?: string;
  lesson_title: string;
  lesson_summary?: string | null;
  prerequisite_knowledge?: string | null;
  planned_date?: string;
  duration_minutes?: number;
  resource_ids?: Array<{
    resource_id: string;
    usage_notes?: string | null;
    sequence_number?: number;
  }>;
  outcomes?: Array<{
    learning_outcome_id: string;
    coverage_notes?: string | null;
  }>;
  preparation_questions?: Array<{
    prompt: string;
    expected_response?: string | null;
    sequence_number?: number;
  }>;
  in_class_activities?: Array<{
    activity_type: string;
    activity_title: string;
    activity_description?: string | null;
    duration_minutes?: number | null;
    materials_required?: string | null;
    sequence_number?: number;
  }>;
}

export interface ClassroomRosterStudentDto {
  student_id: string;
  enrollment_id: string;
  admission_no: string | null;
  roll_number: string | null;
  full_name: string;
  session_attendance_id: string | null;
  attendance_status: ClassroomAttendanceStatus | null;
  participation_mode: ClassroomParticipationMode | null;
  recorded_at: string | null;
  recorded_by: string | null;
  remarks: string | null;
}

export interface TeacherOverviewDto {
  teacher: {
    staff_id: string;
    full_name: string;
  };
  kpis: {
    assigned_classes_count: number;
    live_sessions_count: number;
    today_sessions_count: number;
    upcoming_sessions_count: number;
    completed_sessions_count: number;
  };
  assignments: Array<{
    faculty_assignment_id: string;
    assignment_role: string;
    section_id: string;
    section_name: string;
    grade_id: string;
    grade_name: string;
    grade_code: string;
    academic_year_id: string;
    academic_year_name: string;
    academic_year_grade_subject_id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    active_students_count: number;
  }>;
  classrooms: Array<{
    classroom_id: string;
    room_code: string;
    room_name: string;
    room_type: string;
    building_name: string | null;
    floor_name: string | null;
    capacity: number | null;
  }>;
  lesson_plans: Array<{
    lesson_plan_id: string;
    lesson_title: string;
    teaching_approach: ClassroomTeachingApproach;
    curriculum_unit_id: string;
    unit_title: string;
    academic_year_grade_subject_id: string;
  }>;
  academic_years: Array<{
    academic_year_id: string;
    academic_year_name: string;
    status: string;
    start_date: string;
    end_date: string;
  }>;
}

export interface AttendanceStatsSummaryDto {
  total_sessions: number;
  conducted_sessions: number;
  marked_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  attended_count: number;
  attendance_percentage: number;
}

export interface SessionListQuery {
  status?: ClassroomSessionStatus;
  delivery_mode?: ClassroomDeliveryMode;
  teaching_approach?: ClassroomTeachingApproach;
  section_id?: string;
  subject_id?: string;
  academic_year_id?: string;
  date_from?: string;
  date_to?: string;
  view?: 'all' | 'live' | 'upcoming' | 'past' | 'today';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSessionsResponse {
  items: ClassroomSessionDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TeacherSessionDetailDto {
  session: ClassroomSessionDto;
  roster: ClassroomRosterStudentDto[];
  capabilities: {
    can_edit_metadata: boolean;
    can_edit_schedule: boolean;
    can_start: boolean;
    can_complete: boolean;
    can_cancel: boolean;
    can_mark_not_conducted: boolean;
    can_edit_attendance: boolean;
    attendance_lock_reason: string | null;
  };
  flipped_preparation?: FlippedPreparationDto | null;
}

export interface ClassroomAuditRowDto {
  audit_id: string;
  entity_type: 'classroom_session' | 'session_attendance';
  entity_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any;
  new_values: any;
  actor_user_id: string | null;
  actor_name: string;
  occurred_at: string;
}

function unwrap<T>(res: any): T {
  return res?.data !== undefined ? res.data : res;
}

export const classroomApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ─── TEACHER ENDPOINTS ─────────────────────────────────────────────────
    getTeacherClassroomOverview: builder.query<TeacherOverviewDto, void>({
      query: () => ENDPOINTS.CLASSROOM.TEACHER_OVERVIEW,
      transformResponse: unwrap,
      providesTags: ['ClassroomOverview', 'ClassroomSession'],
    }),
    getTeacherClassroomSessions: builder.query<PaginatedSessionsResponse, SessionListQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSIONS,
        params: params || undefined,
      }),
      transformResponse: unwrap,
      providesTags: ['ClassroomSession'],
    }),
    getTeacherClassroomSessionDetail: builder.query<TeacherSessionDetailDto, string>({
      query: (sessionId) => ENDPOINTS.CLASSROOM.TEACHER_SESSION_BY_ID(sessionId),
      transformResponse: unwrap,
      providesTags: (_res, _err, sessionId) => [
        { type: 'ClassroomSession', id: sessionId },
        { type: 'ClassroomAttendance', id: sessionId },
      ],
    }),
    getTeacherSessionAudit: builder.query<
      {
        items: ClassroomAuditRowDto[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      },
      { sessionId: string; page?: number; limit?: number }
    >({
      query: ({ sessionId, ...params }) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_AUDIT(sessionId),
        params,
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, { sessionId }) => [
        { type: 'ClassroomSession', id: `audit-${sessionId}` },
      ],
    }),
    createTeacherClassroomSession: builder.mutation<
      ClassroomSessionDto,
      {
        faculty_assignment_id: string;
        session_date: string;
        scheduled_start_time: string;
        scheduled_end_time: string;
        delivery_mode: ClassroomDeliveryMode;
        teaching_approach: ClassroomTeachingApproach;
        classroom_id?: string | null;
        meeting_url?: string | null;
        lesson_plan_id?: string | null;
        topics_covered?: string | null;
        teacher_remarks?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSIONS,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['ClassroomSession', 'ClassroomOverview'],
    }),
    updateTeacherClassroomSession: builder.mutation<
      ClassroomSessionDto,
      {
        sessionId: string;
        body: Partial<{
          session_date: string;
          scheduled_start_time: string;
          scheduled_end_time: string;
          delivery_mode: ClassroomDeliveryMode;
          teaching_approach: ClassroomTeachingApproach;
          classroom_id: string | null;
          meeting_url: string | null;
          lesson_plan_id: string | null;
          topics_covered: string | null;
          teacher_remarks: string | null;
        }>;
      }
    >({
      query: ({ sessionId, body }) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_BY_ID(sessionId),
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, { sessionId }) => [
        'ClassroomSession',
        'ClassroomOverview',
        { type: 'ClassroomSession', id: sessionId },
      ],
    }),
    startTeacherClassroomSession: builder.mutation<any, string>({
      query: (sessionId) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_START(sessionId),
        method: 'POST',
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, sessionId) => [
        'ClassroomSession',
        'ClassroomOverview',
        { type: 'ClassroomSession', id: sessionId },
        { type: 'ClassroomSession', id: `audit-${sessionId}` },
      ],
    }),
    completeTeacherClassroomSession: builder.mutation<
      any,
      { sessionId: string; topics_covered?: string | null; teacher_remarks?: string | null }
    >({
      query: ({ sessionId, ...body }) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_COMPLETE(sessionId),
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, { sessionId }) => [
        'ClassroomSession',
        'ClassroomOverview',
        { type: 'ClassroomSession', id: sessionId },
        { type: 'ClassroomSession', id: `audit-${sessionId}` },
      ],
    }),
    cancelTeacherClassroomSession: builder.mutation<
      any,
      { sessionId: string; teacher_remarks?: string | null }
    >({
      query: ({ sessionId, ...body }) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_CANCEL(sessionId),
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, { sessionId }) => [
        'ClassroomSession',
        'ClassroomOverview',
        { type: 'ClassroomSession', id: sessionId },
      ],
    }),
    markTeacherSessionNotConducted: builder.mutation<
      any,
      { sessionId: string; not_conducted_reason: string; teacher_remarks?: string | null }
    >({
      query: ({ sessionId, ...body }) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_NOT_CONDUCTED(sessionId),
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, { sessionId }) => [
        'ClassroomSession',
        'ClassroomOverview',
        { type: 'ClassroomSession', id: sessionId },
      ],
    }),
    markTeacherClassroomAttendance: builder.mutation<
      TeacherSessionDetailDto & { updated_count: number },
      {
        sessionId: string;
        records: Array<{
          student_id: string;
          enrollment_id?: string;
          attendance_status: ClassroomAttendanceStatus;
          participation_mode?: ClassroomParticipationMode | null;
          remarks?: string | null;
        }>;
      }
    >({
      query: ({ sessionId, records }) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_SESSION_ATTENDANCE(sessionId),
        method: 'PUT',
        body: { records },
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, { sessionId }) => [
        'ClassroomSession',
        'ClassroomAttendance',
        { type: 'ClassroomSession', id: sessionId },
        { type: 'ClassroomAttendance', id: sessionId },
        { type: 'ClassroomSession', id: `audit-${sessionId}` },
      ],
    }),

    // ─── ADMIN ENDPOINTS ───────────────────────────────────────────────────
    getAdminClassroomAcademicYears: builder.query<any[], void>({
      query: () => ENDPOINTS.CLASSROOM.ADMIN_ACADEMIC_YEARS,
      transformResponse: unwrap,
    }),
    getAdminClassroomSessions: builder.query<PaginatedSessionsResponse, SessionListQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.CLASSROOM.ADMIN_SESSIONS,
        params: params || undefined,
      }),
      transformResponse: unwrap,
      providesTags: ['ClassroomSession'],
    }),
    generateAdminClassroomSessions: builder.mutation<
      { academic_year_id: string; start_date: string; end_date: string; created_count: number },
      { academic_year_id: string; start_date: string; end_date: string }
    >({
      query: (body) => ({
        url: ENDPOINTS.CLASSROOM.ADMIN_SESSIONS_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['ClassroomSession', 'ClassroomOverview'],
    }),

    // ─── STUDENT ENDPOINTS ─────────────────────────────────────────────────
    getStudentClassroomOverview: builder.query<
      {
        student: {
          student_id: string;
          full_name: string;
          admission_no: string | null;
          grade_name: string | null;
          section_id: string | null;
          section_name: string | null;
          academic_year_name: string | null;
        };
        attendance_summary: AttendanceStatsSummaryDto;
        upcoming_sessions: ClassroomSessionDto[];
        classes: any[];
      },
      void
    >({
      query: () => ENDPOINTS.CLASSROOM.STUDENT_OVERVIEW,
      transformResponse: unwrap,
      providesTags: ['ClassroomOverview', 'ClassroomSession', 'ClassroomAttendance'],
    }),
    getStudentClassroomSessions: builder.query<PaginatedSessionsResponse, SessionListQuery | void>({
      query: (params) => ({
        url: ENDPOINTS.CLASSROOM.STUDENT_SESSIONS,
        params: params || undefined,
      }),
      transformResponse: unwrap,
      providesTags: ['ClassroomSession', 'ClassroomAttendance'],
    }),
    getStudentClassroomAttendance: builder.query<
      {
        summary: AttendanceStatsSummaryDto;
        items: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      },
      { date_from?: string; date_to?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: ENDPOINTS.CLASSROOM.STUDENT_ATTENDANCE,
        params: params || undefined,
      }),
      transformResponse: unwrap,
      providesTags: ['ClassroomAttendance'],
    }),
    joinStudentClassroomSession: builder.mutation<
      {
        session_id: string;
        meeting_url: string;
        attendance: any;
        already_recorded: boolean;
      },
      string
    >({
      query: (sessionId) => ({
        url: ENDPOINTS.CLASSROOM.STUDENT_SESSION_JOIN(sessionId),
        method: 'POST',
      }),
      transformResponse: unwrap,
      invalidatesTags: ['ClassroomSession', 'ClassroomAttendance', 'ClassroomOverview'],
    }),

    // ─── PARENT ENDPOINTS (READ-ONLY) ──────────────────────────────────────
    getParentChildClassroomOverview: builder.query<
      {
        child: {
          student_id: string;
          full_name: string;
          admission_no: string | null;
          grade_name: string | null;
          section_id: string | null;
          section_name: string | null;
          academic_year_name: string | null;
        };
        attendance_summary: AttendanceStatsSummaryDto;
        upcoming_sessions: ClassroomSessionDto[];
      },
      string
    >({
      query: (childId) => ENDPOINTS.CLASSROOM.PARENT_CHILD_OVERVIEW(childId),
      transformResponse: unwrap,
      providesTags: ['ClassroomOverview', 'ClassroomSession', 'ClassroomAttendance'],
    }),
    getParentChildClassroomSessions: builder.query<
      PaginatedSessionsResponse,
      { childId: string; params?: SessionListQuery }
    >({
      query: ({ childId, params }) => ({
        url: ENDPOINTS.CLASSROOM.PARENT_CHILD_SESSIONS(childId),
        params: params || undefined,
      }),
      transformResponse: unwrap,
      providesTags: ['ClassroomSession', 'ClassroomAttendance'],
    }),
    getParentChildClassroomAttendance: builder.query<
      {
        summary: AttendanceStatsSummaryDto;
        items: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      },
      { childId: string; date_from?: string; date_to?: string; page?: number; limit?: number }
    >({
      query: ({ childId, ...params }) => ({
        url: ENDPOINTS.CLASSROOM.PARENT_CHILD_ATTENDANCE(childId),
        params,
      }),
      transformResponse: unwrap,
      providesTags: ['ClassroomAttendance'],
    }),
    createTeacherFlippedPreparation: builder.mutation<
      FlippedPreparationDto,
      CreateFlippedPreparationPayload
    >({
      query: (body) => ({
        url: ENDPOINTS.CLASSROOM.TEACHER_FLIPPED_PREPARATION,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['ClassroomSession', 'ClassroomOverview'],
    }),
    getTeacherFlippedPreparation: builder.query<FlippedPreparationDto, string>({
      query: (lessonPlanId) => ENDPOINTS.CLASSROOM.TEACHER_FLIPPED_PREPARATION_BY_ID(lessonPlanId),
      transformResponse: unwrap,
      providesTags: (_res, _err, id) => [{ type: 'ClassroomSession', id: `prep-${id}` }],
    }),
    getStudentFlippedPreparations: builder.query<ClassroomSessionDto[], void>({
      query: () => ENDPOINTS.CLASSROOM.STUDENT_FLIPPED_PREPARATION,
      transformResponse: unwrap,
      providesTags: ['ClassroomSession'],
    }),
  }),
});

export const {
  useGetTeacherClassroomOverviewQuery,
  useGetTeacherClassroomSessionsQuery,
  useGetTeacherClassroomSessionDetailQuery,
  useGetTeacherSessionAuditQuery,
  useCreateTeacherClassroomSessionMutation,
  useUpdateTeacherClassroomSessionMutation,
  useStartTeacherClassroomSessionMutation,
  useCompleteTeacherClassroomSessionMutation,
  useCancelTeacherClassroomSessionMutation,
  useMarkTeacherSessionNotConductedMutation,
  useMarkTeacherClassroomAttendanceMutation,
  useCreateTeacherFlippedPreparationMutation,
  useGetTeacherFlippedPreparationQuery,
  useGetAdminClassroomAcademicYearsQuery,
  useGetAdminClassroomSessionsQuery,
  useGenerateAdminClassroomSessionsMutation,
  useGetStudentClassroomOverviewQuery,
  useGetStudentClassroomSessionsQuery,
  useGetStudentClassroomAttendanceQuery,
  useGetStudentFlippedPreparationsQuery,
  useJoinStudentClassroomSessionMutation,
  useGetParentChildClassroomOverviewQuery,
  useGetParentChildClassroomSessionsQuery,
  useGetParentChildClassroomAttendanceQuery,
} = classroomApi;
