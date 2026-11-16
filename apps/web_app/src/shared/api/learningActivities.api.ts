import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export type LearningActivityType = 'homework' | 'project';

export type LearningActivitySubtype =
  | 'homework'
  | 'project'
  | 'coding_lab'
  | 'video_submission'
  | 'audio_submission'
  | 'quiz'
  | 'peer_learning'
  | 'collaborative';

export interface CodingLabConfig {
  language: string; // 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'sql' | 'html'
  problem_statement?: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  sample_input?: string;
  sample_output?: string;
  starter_code?: string;
}

export interface QuizOptionConfig {
  key: string;
  text: string;
}

export interface QuizQuestionConfig {
  question_id: string;
  question_text: string;
  options: QuizOptionConfig[];
  correct_key?: string;
  explanation?: string;
  marks?: number;
}

export interface QuizConfig {
  duration_minutes?: number;
  questions: QuizQuestionConfig[];
  shuffle_questions?: boolean;
}

export interface PeerLearningConfig {
  learning_objective?: string;
  group_size?: number;
  discussion_prompts?: string[];
  rubric_criteria?: string[];
}

export interface CollaborativeConfig {
  group_name?: string;
  team_roles?: string[];
  shared_deliverables?: string[];
  contribution_guidelines?: string;
}

export type LearningActivityStatus = 'draft' | 'published' | 'closed';
export type LearningSubmissionStatus =
  'submitted' | 'under_review' | 'resubmission_requested' | 'reviewed';
export type LearningReviewDecision = 'reviewed' | 'resubmission_requested';

export interface LearningSubmissionFileDto {
  submission_file_id: string;
  submission_id: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface LearningSubmissionReviewDto {
  review_id: string;
  org_id: string;
  submission_id: string;
  reviewed_by_staff_id: string;
  reviewer_name: string;
  review_decision: LearningReviewDecision;
  obtained_marks: number | null;
  feedback: string | null;
  resubmission_allowed_until: string | null;
  reviewed_at: string;
}

export interface LearningSubmissionDto {
  submission_id: string;
  org_id: string;
  activity_id: string;
  student_id: string;
  student_name: string;
  admission_no: string | null;
  enrollment_id: string;
  attempt_number: number;
  text_content: string | null;
  submitted_at: string;
  is_late: boolean;
  submission_status: LearningSubmissionStatus;
  created_at: string;
  files: LearningSubmissionFileDto[];
  reviews: LearningSubmissionReviewDto[];
  latest_review: LearningSubmissionReviewDto | null;
}

export interface LearningActivityDto {
  activity_id: string;
  org_id: string;
  faculty_assignment_id: string;
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
  created_by_staff_id: string;
  teacher_user_id: string | null;
  teacher_name: string;
  lesson_plan_id: string | null;
  lesson_title: string | null;
  activity_type: LearningActivityType;
  activity_subtype?: LearningActivitySubtype;
  coding_lab_config?: CodingLabConfig | null;
  quiz_config?: QuizConfig | null;
  peer_learning_config?: PeerLearningConfig | null;
  collaborative_config?: CollaborativeConfig | null;
  title: string;
  instructions: string;
  assigned_at: string;
  due_at: string;
  late_submission_authorized_until: string | null;
  grading_enabled: boolean;
  maximum_marks: number | null;
  activity_status: LearningActivityStatus;
  published_at: string | null;
  closed_at: string | null;
  closure_reason: string | null;
  created_at: string;
  updated_at: string;
  total_enrolled_students: number;
  submitted_students_count: number;
  reviewed_submissions_count: number;
  pending_review_count: number;
  late_submissions_count: number;
  my_latest_submission?: LearningSubmissionDto | null;
  my_submissions_count?: number;
  can_submit?: boolean;
  submission_block_reason?: string | null;
}

export interface TeacherAssignmentOptionDto {
  faculty_assignment_id: string;
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
  effective_from: string;
  effective_to: string | null;
  lesson_plans: Array<{
    lesson_plan_id: string;
    lesson_title: string;
    status: string;
  }>;
}

export interface TeacherSubmissionItemDto extends LearningSubmissionDto {
  activity_title: string;
  subject_name: string;
  grade_name: string;
  section_name: string;
  due_at: string;
  grading_enabled: boolean;
  maximum_marks: number | null;
}

export interface LearningActivityAuditDto {
  audit_id: string;
  org_id: string;
  activity_id: string;
  actor_staff_id: string | null;
  actor_name: string | null;
  action: string;
  old_values: unknown;
  new_values: unknown;
  occurred_at: string;
}

export interface TeacherLearningOverviewDto {
  staff_id: string;
  total_activities: number;
  draft_count: number;
  published_count: number;
  closed_count: number;
  homework_count: number;
  project_count: number;
  pending_reviews_count: number;
  resubmissions_requested_count: number;
  recent_activities: LearningActivityDto[];
  pending_submissions: TeacherSubmissionItemDto[];
}

export interface StudentLearningOverviewDto {
  student_id: string;
  student_name: string;
  grade_name: string | null;
  section_name: string | null;
  total_assigned: number;
  homework_count: number;
  project_count: number;
  pending_projects_count: number;
  submitted_count: number;
  under_review_count: number;
  resubmission_requested_count: number;
  reviewed_count: number;
  overdue_count: number;
  upcoming_activities: LearningActivityDto[];
}

export interface ParentChildLearningOverviewDto {
  child: {
    student_id: string;
    full_name: string;
    admission_no: string | null;
    grade_name: string | null;
    section_name: string | null;
    academic_year_name: string | null;
  };
  total_assigned: number;
  homework_count: number;
  project_count: number;
  pending_projects_count: number;
  submitted_count: number;
  resubmission_requested_count: number;
  reviewed_count: number;
  overdue_count: number;
  recent_activities: LearningActivityDto[];
}

export interface AdminLearningOverviewDto {
  org_id: string;
  total_activities: number;
  draft_count: number;
  published_count: number;
  closed_count: number;
  overdue_published_count: number;
  homework_count: number;
  project_count: number;
  total_submissions: number;
  pending_reviews_count: number;
  resubmission_requested_count: number;
  reviewed_count: number;
  late_submissions_count: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ActivityQueryParams {
  activity_type?: LearningActivityType;
  activity_subtype?: LearningActivitySubtype;
  activity_status?: LearningActivityStatus;
  section_id?: string;
  subject_id?: string;
  academic_year_id?: string;
  submission_status?: LearningSubmissionStatus;
  view?:
    | 'all'
    | 'pending'
    | 'upcoming'
    | 'overdue'
    | 'submitted'
    | 'reviewed'
    | 'resubmission_requested';
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmissionDownloadUrlDto {
  submission_file_id: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: number;
  download_url: string;
  expires_at: string;
}

function unwrap<T>(res: { success: boolean; data: T }): T {
  return res.data;
}

export const learningActivitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ─── TEACHER ENDPOINTS ──────────────────────────────────────────────────
    getTeacherLearningOverview: builder.query<TeacherLearningOverviewDto, void>({
      query: () => ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_OVERVIEW,
      transformResponse: unwrap<TeacherLearningOverviewDto>,
      providesTags: ['LearningOverview', 'LearningActivity', 'LearningSubmission'],
    }),
    getTeacherLearningAssignments: builder.query<TeacherAssignmentOptionDto[], void>({
      query: () => ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ASSIGNMENTS,
      transformResponse: unwrap<TeacherAssignmentOptionDto[]>,
      providesTags: ['LearningActivity'],
    }),
    getTeacherLearningActivities: builder.query<
      PaginatedResult<LearningActivityDto>,
      ActivityQueryParams | void
    >({
      query: (params) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITIES,
        params: params || undefined,
      }),
      transformResponse: unwrap<PaginatedResult<LearningActivityDto>>,
      providesTags: ['LearningActivity'],
    }),
    getTeacherLearningActivityDetail: builder.query<
      { activity: LearningActivityDto; submissions: TeacherSubmissionItemDto[] },
      string
    >({
      query: (activityId) => ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITY_BY_ID(activityId),
      transformResponse: unwrap<{
        activity: LearningActivityDto;
        submissions: TeacherSubmissionItemDto[];
      }>,
      providesTags: (_res, _err, id) => [{ type: 'LearningActivity', id }, 'LearningSubmission'],
    }),
    getTeacherLearningActivityAudit: builder.query<LearningActivityAuditDto[], string>({
      query: (activityId) => ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITY_AUDIT(activityId),
      transformResponse: unwrap<LearningActivityAuditDto[]>,
      providesTags: (_res, _err, id) => [{ type: 'LearningActivity', id }],
    }),
    createTeacherLearningActivity: builder.mutation<
      LearningActivityDto,
      {
        faculty_assignment_id: string;
        lesson_plan_id?: string | null;
        activity_type: LearningActivityType;
        activity_subtype?: LearningActivitySubtype;
        coding_lab_config?: CodingLabConfig | null;
        quiz_config?: QuizConfig | null;
        peer_learning_config?: PeerLearningConfig | null;
        collaborative_config?: CollaborativeConfig | null;
        title: string;
        instructions: string;
        assigned_at?: string;
        due_at: string;
        late_submission_authorized_until?: string | null;
        grading_enabled: boolean;
        maximum_marks?: number | null;
        publish_immediately?: boolean;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITIES,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap<LearningActivityDto>,
      invalidatesTags: ['LearningActivity', 'LearningOverview'],
    }),
    updateTeacherLearningActivity: builder.mutation<
      LearningActivityDto,
      {
        activityId: string;
        body: Partial<{
          lesson_plan_id: string | null;
          activity_type: LearningActivityType;
          activity_subtype?: LearningActivitySubtype;
          coding_lab_config?: CodingLabConfig | null;
          quiz_config?: QuizConfig | null;
          peer_learning_config?: PeerLearningConfig | null;
          collaborative_config?: CollaborativeConfig | null;
          title: string;
          instructions: string;
          assigned_at: string;
          due_at: string;
          late_submission_authorized_until: string | null;
          grading_enabled: boolean;
          maximum_marks: number | null;
        }>;
      }
    >({
      query: ({ activityId, body }) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITY_BY_ID(activityId),
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap<LearningActivityDto>,
      invalidatesTags: (_res, _err, arg) => [
        'LearningActivity',
        'LearningOverview',
        { type: 'LearningActivity', id: arg.activityId },
      ],
    }),
    publishTeacherLearningActivity: builder.mutation<LearningActivityDto, string>({
      query: (activityId) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITY_PUBLISH(activityId),
        method: 'POST',
      }),
      transformResponse: unwrap<LearningActivityDto>,
      invalidatesTags: (_res, _err, id) => [
        'LearningActivity',
        'LearningOverview',
        { type: 'LearningActivity', id },
      ],
    }),
    closeTeacherLearningActivity: builder.mutation<
      LearningActivityDto,
      { activityId: string; closure_reason?: string | null }
    >({
      query: ({ activityId, closure_reason }) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITY_CLOSE(activityId),
        method: 'POST',
        body: { closure_reason },
      }),
      transformResponse: unwrap<LearningActivityDto>,
      invalidatesTags: (_res, _err, arg) => [
        'LearningActivity',
        'LearningOverview',
        { type: 'LearningActivity', id: arg.activityId },
      ],
    }),
    extendTeacherLearningLateDeadline: builder.mutation<
      LearningActivityDto,
      { activityId: string; late_submission_authorized_until: string | null }
    >({
      query: ({ activityId, late_submission_authorized_until }) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_ACTIVITY_EXTEND_LATE(activityId),
        method: 'POST',
        body: { late_submission_authorized_until },
      }),
      transformResponse: unwrap<LearningActivityDto>,
      invalidatesTags: (_res, _err, arg) => [
        'LearningActivity',
        'LearningOverview',
        { type: 'LearningActivity', id: arg.activityId },
      ],
    }),
    closeDueTeacherActivities: builder.mutation<{ closed_count: number }, void>({
      query: () => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_CLOSE_DUE,
        method: 'POST',
      }),
      transformResponse: unwrap<{ closed_count: number }>,
      invalidatesTags: ['LearningActivity', 'LearningOverview'],
    }),
    getTeacherLearningSubmissions: builder.query<
      PaginatedResult<TeacherSubmissionItemDto>,
      {
        activity_id?: string;
        submission_status?: LearningSubmissionStatus;
        is_late?: 'true' | 'false';
        search?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_SUBMISSIONS,
        params: params || undefined,
      }),
      transformResponse: unwrap<PaginatedResult<TeacherSubmissionItemDto>>,
      providesTags: ['LearningSubmission'],
    }),
    startTeacherSubmissionReview: builder.mutation<TeacherSubmissionItemDto, string>({
      query: (submissionId) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_START_REVIEW(submissionId),
        method: 'POST',
      }),
      transformResponse: unwrap<TeacherSubmissionItemDto>,
      invalidatesTags: ['LearningSubmission', 'LearningOverview', 'LearningActivity'],
    }),
    reviewTeacherSubmission: builder.mutation<
      TeacherSubmissionItemDto,
      {
        submissionId: string;
        body: {
          review_decision: LearningReviewDecision;
          obtained_marks?: number | null;
          feedback?: string | null;
          resubmission_allowed_until?: string | null;
        };
      }
    >({
      query: ({ submissionId, body }) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_REVIEW_SUBMISSION(submissionId),
        method: 'POST',
        body,
      }),
      transformResponse: unwrap<TeacherSubmissionItemDto>,
      invalidatesTags: ['LearningSubmission', 'LearningOverview', 'LearningActivity'],
    }),
    getTeacherFileDownloadUrl: builder.mutation<SubmissionDownloadUrlDto, string>({
      query: (fileId) => ENDPOINTS.LEARNING_ACTIVITIES.TEACHER_FILE_DOWNLOAD(fileId),
      transformResponse: unwrap<SubmissionDownloadUrlDto>,
    }),

    // ─── STUDENT ENDPOINTS ──────────────────────────────────────────────────
    getStudentLearningOverview: builder.query<StudentLearningOverviewDto, void>({
      query: () => ENDPOINTS.LEARNING_ACTIVITIES.STUDENT_OVERVIEW,
      transformResponse: unwrap<StudentLearningOverviewDto>,
      providesTags: ['LearningOverview', 'LearningActivity', 'LearningSubmission'],
    }),
    getStudentLearningActivities: builder.query<
      PaginatedResult<LearningActivityDto>,
      ActivityQueryParams | void
    >({
      query: (params) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.STUDENT_ACTIVITIES,
        params: params || undefined,
      }),
      transformResponse: unwrap<PaginatedResult<LearningActivityDto>>,
      providesTags: ['LearningActivity', 'LearningSubmission'],
    }),
    getStudentLearningActivityDetail: builder.query<
      { activity: LearningActivityDto; attempts: LearningSubmissionDto[] },
      string
    >({
      query: (activityId) => ENDPOINTS.LEARNING_ACTIVITIES.STUDENT_ACTIVITY_BY_ID(activityId),
      transformResponse: unwrap<{
        activity: LearningActivityDto;
        attempts: LearningSubmissionDto[];
      }>,
      providesTags: (_res, _err, id) => [{ type: 'LearningActivity', id }, 'LearningSubmission'],
    }),
    submitStudentProject: builder.mutation<
      LearningSubmissionDto,
      { activityId: string; formData: FormData }
    >({
      query: ({ activityId, formData }) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.STUDENT_ACTIVITY_SUBMIT(activityId),
        method: 'POST',
        body: formData,
      }),
      transformResponse: unwrap<LearningSubmissionDto>,
      invalidatesTags: (_res, _err, arg) => [
        'LearningActivity',
        'LearningSubmission',
        'LearningOverview',
        { type: 'LearningActivity', id: arg.activityId },
      ],
    }),
    getStudentFileDownloadUrl: builder.mutation<SubmissionDownloadUrlDto, string>({
      query: (fileId) => ENDPOINTS.LEARNING_ACTIVITIES.STUDENT_FILE_DOWNLOAD(fileId),
      transformResponse: unwrap<SubmissionDownloadUrlDto>,
    }),

    // ─── PARENT READ-ONLY ENDPOINTS ─────────────────────────────────────────
    getParentChildLearningOverview: builder.query<ParentChildLearningOverviewDto, string>({
      query: (childId) => ENDPOINTS.LEARNING_ACTIVITIES.PARENT_CHILD_OVERVIEW(childId),
      transformResponse: unwrap<ParentChildLearningOverviewDto>,
      providesTags: (_res, _err, childId) => [
        { type: 'LearningOverview', id: childId },
        'LearningActivity',
        'LearningSubmission',
      ],
    }),
    getParentChildLearningActivities: builder.query<
      PaginatedResult<LearningActivityDto>,
      { childId: string; params?: ActivityQueryParams }
    >({
      query: ({ childId, params }) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.PARENT_CHILD_ACTIVITIES(childId),
        params: params || undefined,
      }),
      transformResponse: unwrap<PaginatedResult<LearningActivityDto>>,
      providesTags: (_res, _err, arg) => [
        { type: 'LearningActivity', id: arg.childId },
        'LearningSubmission',
      ],
    }),
    getParentChildLearningActivityDetail: builder.query<
      { activity: LearningActivityDto; attempts: LearningSubmissionDto[] },
      { childId: string; activityId: string }
    >({
      query: ({ childId, activityId }) =>
        ENDPOINTS.LEARNING_ACTIVITIES.PARENT_CHILD_ACTIVITY_BY_ID(childId, activityId),
      transformResponse: unwrap<{
        activity: LearningActivityDto;
        attempts: LearningSubmissionDto[];
      }>,
      providesTags: (_res, _err, arg) => [
        { type: 'LearningActivity', id: `${arg.childId}:${arg.activityId}` },
      ],
    }),
    getParentChildFileDownloadUrl: builder.mutation<
      SubmissionDownloadUrlDto,
      { childId: string; fileId: string }
    >({
      query: ({ childId, fileId }) =>
        ENDPOINTS.LEARNING_ACTIVITIES.PARENT_CHILD_FILE_DOWNLOAD(childId, fileId),
      transformResponse: unwrap<SubmissionDownloadUrlDto>,
    }),

    // ─── ADMIN OVERSIGHT ENDPOINTS ──────────────────────────────────────────
    getAdminLearningOverview: builder.query<AdminLearningOverviewDto, void>({
      query: () => ENDPOINTS.LEARNING_ACTIVITIES.ADMIN_OVERVIEW,
      transformResponse: unwrap<AdminLearningOverviewDto>,
      providesTags: ['LearningOverview', 'LearningActivity', 'LearningSubmission'],
    }),
    getAdminLearningFilters: builder.query<{ academic_years: any[]; sections: any[] }, void>({
      query: () => ENDPOINTS.LEARNING_ACTIVITIES.ADMIN_FILTERS,
      transformResponse: unwrap<{ academic_years: any[]; sections: any[] }>,
      providesTags: ['LearningActivity'],
    }),
    getAdminLearningActivities: builder.query<
      PaginatedResult<LearningActivityDto>,
      ActivityQueryParams | void
    >({
      query: (params) => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.ADMIN_ACTIVITIES,
        params: params || undefined,
      }),
      transformResponse: unwrap<PaginatedResult<LearningActivityDto>>,
      providesTags: ['LearningActivity'],
    }),
    getAdminLearningActivityDetail: builder.query<
      {
        activity: LearningActivityDto;
        submissions: TeacherSubmissionItemDto[];
        audit: LearningActivityAuditDto[];
      },
      string
    >({
      query: (activityId) => ENDPOINTS.LEARNING_ACTIVITIES.ADMIN_ACTIVITY_BY_ID(activityId),
      transformResponse: unwrap<{
        activity: LearningActivityDto;
        submissions: TeacherSubmissionItemDto[];
        audit: LearningActivityAuditDto[];
      }>,
      providesTags: (_res, _err, id) => [{ type: 'LearningActivity', id }],
    }),
    closeDueAdminActivities: builder.mutation<{ closed_count: number }, void>({
      query: () => ({
        url: ENDPOINTS.LEARNING_ACTIVITIES.ADMIN_CLOSE_DUE,
        method: 'POST',
      }),
      transformResponse: unwrap<{ closed_count: number }>,
      invalidatesTags: ['LearningActivity', 'LearningOverview'],
    }),
    getAdminFileDownloadUrl: builder.mutation<SubmissionDownloadUrlDto, string>({
      query: (fileId) => ENDPOINTS.LEARNING_ACTIVITIES.ADMIN_FILE_DOWNLOAD(fileId),
      transformResponse: unwrap<SubmissionDownloadUrlDto>,
    }),
  }),
});

export const {
  useGetTeacherLearningOverviewQuery,
  useGetTeacherLearningAssignmentsQuery,
  useGetTeacherLearningActivitiesQuery,
  useGetTeacherLearningActivityDetailQuery,
  useGetTeacherLearningActivityAuditQuery,
  useCreateTeacherLearningActivityMutation,
  useUpdateTeacherLearningActivityMutation,
  usePublishTeacherLearningActivityMutation,
  useCloseTeacherLearningActivityMutation,
  useExtendTeacherLearningLateDeadlineMutation,
  useCloseDueTeacherActivitiesMutation,
  useGetTeacherLearningSubmissionsQuery,
  useStartTeacherSubmissionReviewMutation,
  useReviewTeacherSubmissionMutation,
  useGetTeacherFileDownloadUrlMutation,
  useGetStudentLearningOverviewQuery,
  useGetStudentLearningActivitiesQuery,
  useGetStudentLearningActivityDetailQuery,
  useSubmitStudentProjectMutation,
  useGetStudentFileDownloadUrlMutation,
  useGetParentChildLearningOverviewQuery,
  useGetParentChildLearningActivitiesQuery,
  useGetParentChildLearningActivityDetailQuery,
  useGetParentChildFileDownloadUrlMutation,
  useGetAdminLearningOverviewQuery,
  useGetAdminLearningFiltersQuery,
  useGetAdminLearningActivitiesQuery,
  useGetAdminLearningActivityDetailQuery,
  useCloseDueAdminActivitiesMutation,
  useGetAdminFileDownloadUrlMutation,
} = learningActivitiesApi;
