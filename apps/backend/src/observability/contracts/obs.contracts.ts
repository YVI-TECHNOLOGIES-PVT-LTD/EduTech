export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface StructuredLogRecord {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly service: string;
  readonly version: string;
  readonly environment: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly userId?: string;
  readonly tenantId?: string;
  readonly method?: string;
  readonly url?: string;
  readonly statusCode?: number;
  readonly duration?: number;
  readonly meta?: Record<string, any>;
  readonly error?: any;
}

export interface ILogExporter {
  export(record: StructuredLogRecord): void;
}

export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
}

export interface ISpan {
  readonly spanId: string;
  readonly name: string;
  readonly startTime: bigint;
  finish(): number;
}

export interface IMetric {
  readonly name: string;
  readonly help: string;
}

export interface IMetricsRegistry {
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void;
  recordDuration(name: string, durationMs: number, labels?: Record<string, string>): void;
}
