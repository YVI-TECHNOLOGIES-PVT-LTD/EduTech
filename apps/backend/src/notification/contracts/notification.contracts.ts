export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook';

export type DeliveryStatus =
  | 'Queued'
  | 'Accepted'
  | 'Sending'
  | 'Sent'
  | 'Delivered'
  | 'Opened'
  | 'Clicked'
  | 'Bounced'
  | 'Rejected'
  | 'Expired'
  | 'Failed';

export interface NotificationCapabilities {
  readonly supportsHtml: boolean;
  readonly supportsAttachments: boolean;
  readonly supportsScheduling: boolean;
  readonly supportsTemplates: boolean;
  readonly supportsBulk: boolean;
  readonly supportsTracking: boolean;
}

export interface NotificationPayload {
  recipient: string; // Email address, Phone number, Device Token, or Webhook URL
  subject?: string;
  body: string;
  templateId?: string;
  templateVersion?: string;
  variables?: Record<string, any>;
  attachments?: { filename: string; storageKey?: string; buffer?: Buffer; contentType?: string }[];
  channel?: NotificationChannel;
  locale?: string;
}

export interface NotificationResult {
  id: string;
  channel: NotificationChannel;
  provider: string;
  providerMessageId?: string;
  status: DeliveryStatus;
  queuedAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

export interface INotificationProvider {
  readonly channel: NotificationChannel;
  readonly name: string;
  readonly capabilities: NotificationCapabilities;
  send(payload: NotificationPayload): Promise<NotificationResult>;
  sendBatch?(payloads: NotificationPayload[]): Promise<NotificationResult[]>;
  ping(): Promise<boolean>;
}

export interface NotificationTemplate {
  id: string;
  version: string;
  channel: NotificationChannel;
  locale: string;
  subject?: string;
  htmlBody?: string;
  textBody: string;
}
