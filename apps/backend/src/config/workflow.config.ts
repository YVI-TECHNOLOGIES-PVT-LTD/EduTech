import { z } from 'zod';

export const WorkflowConfigSchema = z.object({
  engine: z.enum(['statechart', 'bpmn', 'memory', 'noop']).default('memory'),
  maxStateTransitions: z.coerce.number().default(50),
  executionTimeoutMs: z.coerce.number().default(30000), // 30s timeout
  autoCompensateOnFailure: z.coerce.boolean().default(true),
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
