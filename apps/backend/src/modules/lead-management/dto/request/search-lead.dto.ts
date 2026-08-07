import { z } from 'zod';
import { lead_source, lead_stage, lead_priority } from '@prisma/client';

export const searchLeadSchema = z.object({
  searchText: z.string().optional(),
  stage: z.nativeEnum(lead_stage).optional(),
  status: z.nativeEnum(lead_stage).optional(), // Alias for stage
  source: z.nativeEnum(lead_source).optional(),
  priority: z.nativeEnum(lead_priority).optional(),
  assigned_counsellor_id: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(), // Alias
  academic_year_grade_id: z.string().uuid().optional(),
  org_id: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum(['created_at', 'updated_at', 'student_first_name', 'stage', 'lead_number']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchLeadDto = z.infer<typeof searchLeadSchema>;
