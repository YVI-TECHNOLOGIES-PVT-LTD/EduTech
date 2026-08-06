import { z } from 'zod';

export const IntegrationConfigSchema = z.object({
  defaultConnector: z.enum(['http', 'graphql', 'webhook', 'memory', 'noop']).default('http'),
  httpTimeoutMs: z.coerce.number().default(10000), // 10s default request timeout
  maxRetries: z.coerce.number().default(3),
  circuitBreakerFailureThreshold: z.coerce.number().default(5),
  circuitBreakerResetTimeoutMs: z.coerce.number().default(30000), // 30s reset timeout
  webhookSecret: z.string().default('edutrack-integration-webhook-secret-key-32chars!!'),
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;
