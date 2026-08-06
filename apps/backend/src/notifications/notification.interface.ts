export interface EmailMessage {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export interface SmsMessage {
  to: string;
  text: string;
}

export interface PushMessage {
  targetToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<void>;
}

export interface SmsProvider {
  sendSms(message: SmsMessage): Promise<void>;
}

export interface PushProvider {
  sendPush(message: PushMessage): Promise<void>;
}

export interface INotificationService {
  sendEmail(message: EmailMessage): Promise<void>;
  sendSms(message: SmsMessage): Promise<void>;
  sendPush(message: PushMessage): Promise<void>;
}
