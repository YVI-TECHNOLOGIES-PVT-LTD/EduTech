import { z } from 'zod';

export const updateBoardAffiliationSchema = z.object({
  board_affiliation: z
    .string()
    .trim()
    .max(50, 'Board affiliation must not exceed 50 characters')
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

export type UpdateBoardAffiliationDto = z.infer<typeof updateBoardAffiliationSchema>;
