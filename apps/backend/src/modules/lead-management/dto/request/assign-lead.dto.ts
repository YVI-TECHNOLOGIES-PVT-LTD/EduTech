import { z } from 'zod';

export const assignLeadSchema = z.object({
  assigned_counsellor_id: z.string().uuid('Valid counselor staff ID is required'),
  remarks: z.string().optional(),
});

export type AssignLeadDto = z.infer<typeof assignLeadSchema>;

export const bulkAssignLeadSchema = z.object({
  lead_ids: z.array(z.string().uuid('Invalid lead ID')).min(1, 'At least one lead ID is required'),
  assigned_counsellor_id: z.string().uuid('Valid counselor staff ID is required'),
  remarks: z.string().optional(),
});

export type BulkAssignLeadDto = z.infer<typeof bulkAssignLeadSchema>;
