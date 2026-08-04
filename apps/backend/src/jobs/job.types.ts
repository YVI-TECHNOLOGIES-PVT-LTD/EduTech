export type QueueName =
  | 'email-queue'
  | 'sms-queue'
  | 'push-queue'
  | 'report-queue'
  | 'export-queue'
  | 'import-queue'
  | 'audit-queue';

export interface QueueConfig {
  name: QueueName;
  dlqName: string;
  concurrency: number;
  maxRetries: number;
  backoffMs: number;
  timeoutMs: number;
}

export interface JobMetadata {
  jobId: string;
  correlationId: string;
  tenantId?: string;
  createdAt: string;
  retryCount: number;
  version: 1;
}

export interface JobPayload<T = any> {
  id: string;
  type: string;
  data: T;
  createdAt: string;
  attempts: number;
  version: string;
  metadata?: JobMetadata;
}

export interface JobEnvelope<T = any> {
  metadata: JobMetadata;
  type: string;
  payload: T;
}

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

export interface SmsJobData {
  phone: string;
  message: string;
}

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
}

export interface ReportJobData {
  reportType: string;
  generatedBy: string;
  filters?: Record<string, any>;
}
