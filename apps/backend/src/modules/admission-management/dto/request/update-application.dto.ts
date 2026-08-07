import { z } from 'zod';
import { application_status } from '../../constants/admission.constants';

export const updateApplicationSchema = z.object({
  status: z.nativeEnum(application_status as any).optional(),
  academic_year_id: z.string().uuid().optional(),
});

export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;
