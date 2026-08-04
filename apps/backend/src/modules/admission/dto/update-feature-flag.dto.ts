import { z } from 'zod';

export const updateFeatureFlagSchema = z.object({
    enabled: z.boolean({
        required_error: 'Enabled flag is required'
    })
});

export type UpdateFeatureFlagDto = z.infer<typeof updateFeatureFlagSchema>;
