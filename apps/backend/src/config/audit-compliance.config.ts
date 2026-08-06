import { z } from 'zod';

export const AuditComplianceConfigSchema = z.object({
  provider: z.enum(['postgres', 'file', 'memory', 'noop']).default('memory'),
  retentionDays: z.coerce.number().default(2555), // 7 years retention
  gdprEnabled: z.coerce.boolean().default(true),
  hashingAlgorithm: z.string().default('sha256'),
});

export type AuditComplianceConfig = z.infer<typeof AuditComplianceConfigSchema>;
