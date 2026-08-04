import { LogLevel, LogContext, StructuredLogRecord } from './logger.types';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'refreshtoken'];

const sanitizeMeta = (meta?: Record<string, any>): Record<string, any> | undefined => {
  if (!meta) return undefined;
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMeta(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export class LoggerService {
  private static instance: LoggerService;

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  log(level: LogLevel, message: string, context: LogContext = {}, meta?: Record<string, any>, error?: any) {
    const record: StructuredLogRecord = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context: {
        service: 'edutrack-api',
        ...context,
      },
      ...(meta && { meta: sanitizeMeta(meta) }),
      ...(error && { error: error.message || error }),
    };

    const formatted = JSON.stringify(record);
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }
}

export const loggerService = LoggerService.getInstance();
