export type ClassroomDeliveryMode = 'physical' | 'online' | 'hybrid';
export type ClassroomTeachingApproach = 'traditional' | 'flipped';
export type ClassroomSessionStatus =
  'scheduled' | 'in_progress' | 'completed' | 'not_conducted' | 'cancelled';
export type ClassroomSessionCreationMethod = 'automatic' | 'manual';
export type ClassroomAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type ClassroomParticipationMode = 'physical' | 'online';
export type ClassroomAuditEntityType = 'classroom_session' | 'session_attendance';
export type ClassroomAuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export const ClassroomEventType = {
  SESSION_SCHEDULED: 'classroom.session_scheduled',
  SESSION_UPDATED: 'classroom.session_updated',
  SESSION_STARTED: 'classroom.session_started',
  SESSION_COMPLETED: 'classroom.session_completed',
  SESSION_CANCELLED: 'classroom.session_cancelled',
  SESSION_NOT_CONDUCTED: 'classroom.session_not_conducted',
  ATTENDANCE_UPDATED: 'classroom.attendance_updated',
} as const;

export type ClassroomEventName = (typeof ClassroomEventType)[keyof typeof ClassroomEventType];

export class ClassroomError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode = 400, code = 'CLASSROOM_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ClassroomValidationError extends ClassroomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ClassroomForbiddenError extends ClassroomError {
  constructor(message = 'You do not have permission to perform this action', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ClassroomNotFoundError extends ClassroomError {
  constructor(message = 'Classroom resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ClassroomConflictError extends ClassroomError {
  constructor(message: string, code = 'CONFLICT', details?: any) {
    super(message, 409, code, details);
  }
}

export interface ClassroomSessionAttendanceSummary {
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
  creation_method: ClassroomSessionCreationMethod;
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
  attendance_summary?: ClassroomSessionAttendanceSummary;
  flipped_preparation?: FlippedPreparationDto | null;
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
  learning_outcomes?: FlippedPreparationOutcomeDto[];
  preparation_questions: FlippedPreparationQuestionDto[];
  questions?: FlippedPreparationQuestionDto[];
  in_class_activities: FlippedInClassActivityDto[];
  post_class_activities: FlippedPostClassActivityDto[];
  monitoring?: {
    enrolled_count: number;
    resources_accessed_count?: number;
    questions_completed_count?: number;
    submission_rate_percent?: number;
  };
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

export interface AttendanceStatsSummary {
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
