import { z } from 'zod';
import { lead_activity_type, activity_status } from '@prisma/client';

export const createActivitySchema = z.object({
  activity_type: z.nativeEnum(lead_activity_type).optional().default(lead_activity_type.follow_up),
  type: z.nativeEnum(lead_activity_type).optional(), // Alias
  activity_date: z.string().optional(),
  status: z.nativeEnum(activity_status).optional().default(activity_status.completed),
  next_followup_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateActivityDto = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  activity_type: z.nativeEnum(lead_activity_type).optional(),
  type: z.nativeEnum(lead_activity_type).optional(), // Alias
  activity_date: z.string().optional(),
  status: z.nativeEnum(activity_status).optional(),
  next_followup_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpdateActivityDto = z.infer<typeof updateActivitySchema>;
