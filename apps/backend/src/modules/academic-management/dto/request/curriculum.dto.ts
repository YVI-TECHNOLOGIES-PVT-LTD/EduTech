import { z } from 'zod';

export const listCurriculumSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  academic_year_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['plan_title', 'created_at', 'status', 'version_number']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListCurriculumInput = z.infer<typeof listCurriculumSchema>;
export type ListCurriculumRawInput = z.input<typeof listCurriculumSchema>;

export const updateCurriculumStatusSchema = z.object({
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived'], {
    required_error: 'Status is required',
  }),
});

export type UpdateCurriculumStatusInput = z.infer<typeof updateCurriculumStatusSchema>;
export type UpdateCurriculumStatusRawInput = z.input<typeof updateCurriculumStatusSchema>;

export const updateCurriculumPlanSchema = z
  .object({
    plan_title: z.string().trim().min(1, 'Title cannot be blank').max(255).optional(),
    plan_description: z.string().trim().optional().nullable(),
    planned_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Planned start date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    planned_end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Planned end date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    coordinator_staff_id: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.planned_start_date && data.planned_end_date) {
        return new Date(data.planned_end_date) >= new Date(data.planned_start_date);
      }
      return true;
    },
    {
      message: 'planned_end_date must be on or after planned_start_date',
      path: ['planned_end_date'],
    },
  );

export type UpdateCurriculumPlanInput = z.infer<typeof updateCurriculumPlanSchema>;
export type UpdateCurriculumPlanRawInput = z.input<typeof updateCurriculumPlanSchema>;
