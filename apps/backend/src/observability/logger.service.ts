import { LogLevel, StructuredLogRecord, ILogExporter } from './contracts/obs.contracts';
import { LogSanitizer } from './sanitizer/log.sanitizer';
import { ConsoleExporter } from './exporters/log.exporters';
import { TraceContextProviderStore } from './trace/trace.engine';
import { RequestContextProviderStore } from '../core/request-context/request-context.provider';

export class LoggerService {
  private static instance: LoggerService;
  private exporter: ILogExporter = new ConsoleExporter();

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public setExporter(exporter: ILogExporter): void {
    this.exporter = exporter;
  }

  public log(level: LogLevel, message: string, meta?: Record<string, any>, error?: any): void {
    const traceCtx = TraceContextProviderStore.current();
    const reqCtx = RequestContextProviderStore.current();

    const record: StructuredLogRecord = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'edutrack-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      requestId: reqCtx?.requestId,
      correlationId: reqCtx?.correlationId,
      traceId: traceCtx?.traceId,
      spanId: traceCtx?.spanId,
      userId: reqCtx?.user?.id,
      tenantId: reqCtx?.tenantId || reqCtx?.user?.orgId,
      meta: LogSanitizer.sanitize(meta),
      error: error ? LogSanitizer.sanitize(error.message || error) : undefined,
    };

    this.exporter.export(record);
  }

  public info(message: string, meta?: Record<string, any>): void {
    this.log('INFO', message, meta);
  }

  public warn(message: string, meta?: Record<string, any>): void {
    this.log('WARN', message, meta);
  }

  public error(message: string, error?: any, meta?: Record<string, any>): void {
    this.log('ERROR', message, meta, error);
  }

  public debug(message: string, meta?: Record<string, any>): void {
    this.log('DEBUG', message, meta);
  }

  public trace(message: string, meta?: Record<string, any>): void {
    this.log('TRACE', message, meta);
  }

  public fatal(message: string, error?: any, meta?: Record<string, any>): void {
    this.log('FATAL', message, meta, error);
  }
}

export const loggerService = LoggerService.getInstance();
