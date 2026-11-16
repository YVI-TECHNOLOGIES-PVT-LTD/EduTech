import { z } from 'zod';

export const listAcademicYearsSchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  is_current: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['academic_year_name', 'start_date', 'end_date', 'status', 'created_at'])
    .optional()
    .default('start_date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListAcademicYearsDto = z.infer<typeof listAcademicYearsSchema>;

export const listGradesSchema = z.object({
  search: z.string().trim().optional(),
  board: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  is_active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['display_order', 'grade_code', 'grade_name', 'created_at'])
    .optional()
    .default('display_order'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ListGradesDto = z.infer<typeof listGradesSchema>;

export const listSectionsSchema = z.object({
  academic_year_id: z.string().uuid().optional(),
  academic_year_grade_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  is_active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['section_name', 'created_at']).optional().default('section_name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ListSectionsDto = z.infer<typeof listSectionsSchema>;

export const searchAcademicSchema = z.object({
  searchText: z.string().optional(),
  org_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  grade_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchAcademicDto = z.infer<typeof searchAcademicSchema>;
