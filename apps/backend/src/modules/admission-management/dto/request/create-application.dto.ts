import { z } from 'zod';
import { application_status } from '../../constants/admission.constants';

export const createApplicationSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),
  org_id: z.string().uuid('Invalid organization ID'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  application_date: z.string().optional(),
  status: z
    .nativeEnum(application_status as any)
    .optional()
    .default(application_status.submitted as any),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
