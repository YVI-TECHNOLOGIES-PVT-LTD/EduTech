export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  tenantId?: string;
  service?: string;
}

export interface StructuredLogRecord {
  level: LogLevel;
  timestamp: string;
  message: string;
  context: LogContext;
  meta?: Record<string, any>;
  error?: any;
}
