import { z } from 'zod';

export const getTeacherWorkspaceSchema = z.object({
  academicYearId: z.string().uuid().optional(),
});
export type GetTeacherWorkspaceInput = z.infer<typeof getTeacherWorkspaceSchema>;

export const teacherScheduleQuerySchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7).optional(),
  academic_year_id: z.string().uuid().optional(),
});
export type TeacherScheduleQuery = z.infer<typeof teacherScheduleQuerySchema>;

export const teacherWorkspaceQuerySchema = z.object({
  staff_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
});
export type TeacherWorkspaceQuery = z.infer<typeof teacherWorkspaceQuerySchema>;

export const listTeacherLessonPlansSchema = z.object({
  academicYearId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListTeacherLessonPlansInput = z.infer<typeof listTeacherLessonPlansSchema>;

export interface TeacherProfileSummary {
  staff_id: string;
  user_id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_code: string | null;
  designation_name: string | null;
}

export interface TeacherAssignedSection {
  section_id: string;
  section_name: string;
  capacity: number | null;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  grade_board: string | null;
  academic_year_grade_id: string;
  academic_year_id: string;
  academic_year_name: string;
  is_class_teacher: boolean;
  assigned_subjects: string[];
}

export interface TeacherAssignedSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  is_active: boolean;
  grade_id: string;
  grade_name: string;
  academic_year_grade_subject_id: string;
  assignment_role: string;
  assigned_sections_count: number;
}

export interface TeacherCurriculumPlan {
  curriculum_plan_id: string;
  plan_title: string;
  status: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grade_id: string;
  grade_name: string;
  units_count: number;
  outcomes_count: number;
}

export interface TeacherDashboardPayload {
  teacher: TeacherProfileSummary;
  academic_year_id: string | null;
  academic_year_name: string | null;
  assigned_sections_count: number;
  assigned_subjects_count: number;
  weekly_periods_count: number;
  today_periods_count: number;
  today_schedule: any[];
  active_lesson_plans_count: number;
  recent_lesson_plans: any[];
  upcoming_events: any[];
}
