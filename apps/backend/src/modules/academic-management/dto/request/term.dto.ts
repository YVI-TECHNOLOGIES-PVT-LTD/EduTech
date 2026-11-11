import { z } from 'zod';

export const listTermsSchema = z.object({
  calendar_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  is_active: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),
});

export type ListTermsInput = z.infer<typeof listTermsSchema>;
export type ListTermsRawInput = z.input<typeof listTermsSchema>;
