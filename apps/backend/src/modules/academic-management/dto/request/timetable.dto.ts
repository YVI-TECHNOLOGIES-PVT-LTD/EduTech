import { z } from 'zod';

export const timetableStatusEnum = z.enum(['draft', 'review', 'published', 'archived']);
export const timetableLessonTypeEnum = z.enum(['theory', 'practical', 'other']);

export const listTimetableVersionsSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic_year_id UUID').optional(),
  status: timetableStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['version_number', 'created_at', 'status']).default('version_number'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getTeacherTimetableSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic_year_id UUID').optional(),
  timetable_version_id: z.string().uuid('Invalid timetable_version_id UUID').optional(),
});

export const getSectionTimetableSchema = z.object({
  timetable_version_id: z.string().uuid('Invalid timetable_version_id UUID').optional(),
});

export const listFacultyWorkloadSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic_year_id UUID').optional(),
  department_id: z.string().uuid('Invalid department_id UUID').optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['weekly_periods', 'name']).default('weekly_periods'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listClassroomsSchema = z.object({
  room_type: z.string().optional(),
  is_active: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
  search: z.string().optional(),
});

export const createTimetableVersionSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic_year_id UUID'),
  version_name: z.string().min(1, 'Version name cannot be empty').max(100),
  notes: z.string().optional(),
});

export const createTimetableEntrySchema = z.object({
  timetable_version_id: z.string().uuid('Invalid timetable_version_id UUID'),
  section_id: z.string().uuid('Invalid section_id UUID'),
  academic_year_grade_subject_id: z.string().uuid('Invalid academic_year_grade_subject_id UUID'),
  faculty_assignment_id: z.string().uuid('Invalid faculty_assignment_id UUID'),
  bell_schedule_period_id: z.string().uuid('Invalid bell_schedule_period_id UUID'),
  weekday: z.coerce.number().int().min(1).max(7),
  classroom_id: z.string().uuid('Invalid classroom_id UUID').optional().nullable(),
  lesson_type: timetableLessonTypeEnum.default('theory'),
  lesson_topic: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateTimetableVersionSchema = z.object({
  version_name: z.string().min(1).max(100).optional(),
  notes: z.string().optional(),
  status: timetableStatusEnum.optional(),
});

export type ListTimetableVersionsInput = z.infer<typeof listTimetableVersionsSchema>;
export type ListTimetableVersionsRawInput = z.input<typeof listTimetableVersionsSchema>;
export type GetTeacherTimetableInput = z.infer<typeof getTeacherTimetableSchema>;
export type GetSectionTimetableInput = z.infer<typeof getSectionTimetableSchema>;
export type ListFacultyWorkloadInput = z.infer<typeof listFacultyWorkloadSchema>;
export type ListFacultyWorkloadRawInput = z.input<typeof listFacultyWorkloadSchema>;
export type ListClassroomsInput = z.infer<typeof listClassroomsSchema>;
export type CreateTimetableVersionInput = z.infer<typeof createTimetableVersionSchema>;
export type CreateTimetableEntryInput = z.infer<typeof createTimetableEntrySchema>;
export type UpdateTimetableVersionInput = z.infer<typeof updateTimetableVersionSchema>;
