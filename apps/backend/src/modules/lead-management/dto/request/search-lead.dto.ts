import { z } from 'zod';
import { lead_source, lead_stage, lead_priority } from '@prisma/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sanitizeUuid = (val?: string | null) =>
  val && UUID_REGEX.test(val.trim()) ? val.trim() : undefined;

export const searchLeadSchema = z.object({
  searchText: z.string().optional(),
  stage: z.nativeEnum(lead_stage).optional(),
  status: z.nativeEnum(lead_stage).optional(), // Alias for stage
  source: z.nativeEnum(lead_source).optional(),
  priority: z.nativeEnum(lead_priority).optional(),
  assigned_counsellor_id: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'unassigned' || val === 'none') return 'unassigned';
      return sanitizeUuid(val);
    }),
  assignedTo: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'unassigned' || val === 'none') return 'unassigned';
      return sanitizeUuid(val);
    }),
  counsellor_status: z.enum(['assigned', 'unassigned']).optional(),
  unassigned: z
    .preprocess((val) => val === true || val === 'true' || val === '1', z.boolean())
    .optional(),
  followup_status: z.enum(['overdue', 'today', 'upcoming', 'none', 'all']).optional(),
  academic_year_grade_id: z.string().optional().transform(sanitizeUuid),
  academic_year_id: z.string().optional().transform(sanitizeUuid),
  grade_id: z.string().optional().transform(sanitizeUuid),
  org_id: z.string().optional().transform(sanitizeUuid),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum([
      'created_at',
      'updated_at',
      'student_first_name',
      'student_name',
      'stage',
      'lead_number',
      'enquiry_date',
      'priority',
      'ai_lead_score',
    ])
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchLeadDto = z.infer<typeof searchLeadSchema>;
