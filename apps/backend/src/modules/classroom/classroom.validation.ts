import { z } from 'zod';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const uuidSchema = z.string().trim().regex(UUID_REGEX, 'Must be a valid UUID');

export function normalizeTimeToHHMMSS(value: string): string {
  const trimmed = value.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

export function isValidCalendarDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidSafeMeetingUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const dateSchema = z
  .string()
  .trim()
  .refine(isValidCalendarDate, 'Date must be a valid calendar date in YYYY-MM-DD format');

export const timeSchema = z
  .string()
  .trim()
  .regex(TIME_REGEX, 'Time must be in HH:mm or HH:mm:ss format')
  .transform(normalizeTimeToHHMMSS);

export const meetingUrlSchema = z
  .string()
  .trim()
  .max(2048, 'Meeting URL must not exceed 2048 characters')
  .refine(isValidSafeMeetingUrl, 'Meeting URL must use http:// or https://')
  .nullable()
  .optional();

export const deliveryModeSchema = z.enum(['physical', 'online', 'hybrid']);
export const teachingApproachSchema = z.enum(['traditional', 'flipped']);
export const sessionStatusSchema = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'not_conducted',
  'cancelled',
]);
export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);
export const participationModeSchema = z.enum(['physical', 'online']);

export const createTeacherSessionSchema = z
  .object({
    faculty_assignment_id: uuidSchema,
    session_date: dateSchema,
    scheduled_start_time: timeSchema,
    scheduled_end_time: timeSchema,
    delivery_mode: deliveryModeSchema,
    teaching_approach: teachingApproachSchema.default('traditional'),
    classroom_id: uuidSchema.nullable().optional(),
    meeting_url: meetingUrlSchema,
    lesson_plan_id: uuidSchema.nullable().optional(),
    topics_covered: z.string().trim().max(4000).nullable().optional(),
    teacher_remarks: z.string().trim().max(4000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduled_end_time <= data.scheduled_start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduled_end_time'],
        message: 'Scheduled end time must be after scheduled start time',
      });
    }

    if (
      (data.delivery_mode === 'physical' || data.delivery_mode === 'hybrid') &&
      !data.classroom_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['classroom_id'],
        message: `Classroom is required for ${data.delivery_mode} sessions`,
      });
    }

    if (data.delivery_mode === 'online' && data.classroom_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['classroom_id'],
        message: 'Online sessions cannot be assigned a physical classroom',
      });
    }

    if (data.delivery_mode === 'physical' && data.meeting_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meeting_url'],
        message: 'Meeting URL should only be set for online or hybrid sessions',
      });
    }

    if ((data.delivery_mode === 'online' || data.delivery_mode === 'hybrid') && !data.meeting_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meeting_url'],
        message: `Meeting link is required for ${data.delivery_mode} sessions`,
      });
    }
  });

export const updateTeacherSessionSchema = z
  .object({
    session_date: dateSchema.optional(),
    scheduled_start_time: timeSchema.optional(),
    scheduled_end_time: timeSchema.optional(),
    delivery_mode: deliveryModeSchema.optional(),
    teaching_approach: teachingApproachSchema.optional(),
    classroom_id: uuidSchema.nullable().optional(),
    meeting_url: meetingUrlSchema,
    lesson_plan_id: uuidSchema.nullable().optional(),
    topics_covered: z.string().trim().max(4000).nullable().optional(),
    teacher_remarks: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const completeSessionSchema = z.object({
  topics_covered: z.string().trim().max(4000).nullable().optional(),
  teacher_remarks: z.string().trim().max(4000).nullable().optional(),
});

export const notConductedSessionSchema = z.object({
  not_conducted_reason: z
    .string()
    .trim()
    .min(3, 'A reason is required to mark a session as not conducted')
    .max(2000),
  teacher_remarks: z.string().trim().max(4000).nullable().optional(),
});

export const cancelSessionSchema = z.object({
  teacher_remarks: z.string().trim().max(4000).nullable().optional(),
});

export const attendanceRecordInputSchema = z
  .object({
    student_id: uuidSchema,
    enrollment_id: uuidSchema.optional(),
    attendance_status: attendanceStatusSchema,
    participation_mode: participationModeSchema.nullable().optional(),
    remarks: z.string().trim().max(1000).nullable().optional(),
  })
  .superRefine((rec, ctx) => {
    const requiresMode = rec.attendance_status === 'present' || rec.attendance_status === 'late';
    if (requiresMode && !rec.participation_mode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participation_mode'],
        message: `participation_mode ('physical' or 'online') is required when attendance_status is '${rec.attendance_status}'`,
      });
    }
    if (!requiresMode && rec.participation_mode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participation_mode'],
        message: `participation_mode must be null when attendance_status is '${rec.attendance_status}'`,
      });
    }
  });

export const markAttendanceSchema = z.object({
  records: z
    .array(attendanceRecordInputSchema)
    .min(1, 'At least one student attendance record is required')
    .max(250, 'Maximum 250 attendance records per request'),
});

export const generateSessionsSchema = z
  .object({
    academic_year_id: uuidSchema,
    start_date: dateSchema,
    end_date: dateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'end_date must be greater than or equal to start_date',
      });
      return;
    }
    const startMs = Date.parse(`${data.start_date}T00:00:00Z`);
    const endMs = Date.parse(`${data.end_date}T00:00:00Z`);
    const days = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 31) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'Date range for synchronous session generation cannot exceed 31 days',
      });
    }
  });

export const listSessionsQuerySchema = z.object({
  status: sessionStatusSchema.optional(),
  delivery_mode: deliveryModeSchema.optional(),
  teaching_approach: teachingApproachSchema.optional(),
  section_id: uuidSchema.optional(),
  subject_id: uuidSchema.optional(),
  academic_year_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  view: z.enum(['all', 'live', 'upcoming', 'past', 'today']).default('all'),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditQuerySchema = z.object({
  entity_type: z.enum(['classroom_session', 'session_attendance']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const flippedActivityTypeSchema = z.enum([
  'direct_instruction',
  'discussion',
  'group_work',
  'individual_work',
  'practical',
  'project',
  'inquiry',
  'assessment',
  'reflection',
  'other',
]);

const flippedResourceItemSchema = z.object({
  resource_id: uuidSchema,
  usage_notes: z.string().trim().max(1000).nullable().optional(),
  access_instructions: z.string().trim().max(1000).nullable().optional(),
  is_mandatory: z.boolean().optional(),
  sequence_number: z.number().int().min(1).optional(),
});

const flippedOutcomeItemSchema = z.object({
  learning_outcome_id: uuidSchema,
  coverage_notes: z.string().trim().max(1000).nullable().optional(),
});

const flippedQuestionItemSchema = z.object({
  prompt: z.string().trim().min(2, 'Prompt is required').max(1000),
  expected_response: z.string().trim().max(2000).nullable().optional(),
  sequence_number: z.number().int().min(1).optional(),
});

export const createFlippedPreparationSchema = z.object({
  curriculum_unit_id: uuidSchema,
  faculty_assignment_id: uuidSchema.optional(),
  lesson_title: z.string().trim().min(3, 'Lesson topic/title is required').max(200),
  lesson_summary: z.string().trim().max(4000).nullable().optional(),
  prerequisite_knowledge: z.string().trim().max(4000).nullable().optional(),
  planned_date: dateSchema.optional(),
  duration_minutes: z.number().int().min(10).max(300).optional().default(45),
  resource_ids: z.array(flippedResourceItemSchema).optional(),
  resources: z.array(flippedResourceItemSchema).optional(),
  outcomes: z.array(flippedOutcomeItemSchema).optional(),
  learning_outcomes: z.array(flippedOutcomeItemSchema).optional(),
  preparation_questions: z.array(flippedQuestionItemSchema).optional(),
  questions: z.array(flippedQuestionItemSchema).optional(),
  in_class_activities: z
    .array(
      z.object({
        activity_type: flippedActivityTypeSchema.default('discussion'),
        activity_title: z.string().trim().min(2).max(200),
        activity_description: z.string().trim().max(2000).nullable().optional(),
        duration_minutes: z.number().int().min(1).max(180).optional(),
        materials_required: z.string().trim().max(1000).nullable().optional(),
        sequence_number: z.number().int().min(1).optional(),
      }),
    )
    .optional()
    .default([]),
});
