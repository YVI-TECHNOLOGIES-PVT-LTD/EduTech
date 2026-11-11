import { z } from 'zod';

export const listCalendarEntriesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    calendar_id: z.string().uuid().optional(),
    academic_year_id: z.string().uuid().optional(),
    term_id: z.string().uuid().optional(),
    entry_type: z
      .enum(['holiday', 'vacation', 'exam', 'school_event', 'school_closure'])
      .optional(),
    grade_id: z.string().uuid().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD format')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be in YYYY-MM-DD format')
      .optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['start_date', 'entry_name', 'entry_type', 'created_at']).default('start_date'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'end_date must be on or after start_date',
      path: ['end_date'],
    },
  );

export type ListCalendarEntriesInput = z.infer<typeof listCalendarEntriesSchema>;
export type ListCalendarEntriesRawInput = z.input<typeof listCalendarEntriesSchema>;
