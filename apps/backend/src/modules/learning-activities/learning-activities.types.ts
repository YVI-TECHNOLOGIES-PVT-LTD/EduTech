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
  correct_key?: string; // Kept secure on server, omitted for students before submission
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

export type LearningActivityEventName =
  | 'learning_activity.published'
  | 'learning_activity.updated'
  | 'learning_activity.closed'
  | 'learning_submission.created'
  | 'learning_submission.reviewed'
  | 'learning_submission.resubmission_requested';

export class LearningActivityError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'LEARNING_ACTIVITY_ERROR',
    details?: unknown,
  ) {
    super(message);
    this.name = 'LearningActivityError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class LearningActivityValidationError extends LearningActivityError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'LearningActivityValidationError';
  }
}

export class LearningActivityForbiddenError extends LearningActivityError {
  constructor(message: string, details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'LearningActivityForbiddenError';
  }
}

export class LearningActivityNotFoundError extends LearningActivityError {
  constructor(message: string, details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'LearningActivityNotFoundError';
  }
}

export class LearningActivityConflictError extends LearningActivityError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'LearningActivityConflictError';
  }
}

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
  pending_submissions: Array<
    LearningSubmissionDto & {
      activity_title: string;
      subject_name: string;
      grade_name: string;
      section_name: string;
      due_at: string;
      grading_enabled: boolean;
      maximum_marks: number | null;
    }
  >;
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
