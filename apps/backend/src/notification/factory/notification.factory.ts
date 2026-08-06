import { INotificationProvider, NotificationChannel } from '../contracts/notification.contracts';
import {
  SmtpEmailProvider,
  TwilioSmsProvider,
  FcmPushProvider,
  WebhookNotificationProvider,
  MemoryNotificationProvider,
  NoopNotificationProvider,
} from '../providers/notification.providers';
import { configuration } from '../../config';

export class NotificationFactory {
  public createProvider(channel: NotificationChannel): INotificationProvider {
    const config = (configuration as any)?.notification;

    switch (channel) {
      case 'email':
        return config?.emailProvider === 'smtp'
          ? new SmtpEmailProvider()
          : new MemoryNotificationProvider('email');
      case 'sms':
        return config?.smsProvider === 'twilio'
          ? new TwilioSmsProvider()
          : new MemoryNotificationProvider('sms');
      case 'push':
        return config?.pushProvider === 'fcm'
          ? new FcmPushProvider()
          : new MemoryNotificationProvider('push');
      case 'webhook':
        return config?.webhookProvider === 'http'
          ? new WebhookNotificationProvider()
          : new MemoryNotificationProvider('webhook');
      default:
        return new MemoryNotificationProvider(channel);
    }
  }
}
