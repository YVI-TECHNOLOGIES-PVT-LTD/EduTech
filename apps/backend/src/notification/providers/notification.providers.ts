import crypto from 'crypto';
import {
  INotificationProvider,
  NotificationCapabilities,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from '../contracts/notification.contracts';
import { DeliveryTracker } from '../tracking/delivery.tracker';

export class MemoryNotificationProvider implements INotificationProvider {
  constructor(public readonly channel: NotificationChannel = 'email') {}

  public readonly name = 'memory';
  public readonly capabilities: NotificationCapabilities = {
    supportsHtml: true,
    supportsAttachments: true,
    supportsScheduling: true,
    supportsTemplates: true,
    supportsBulk: true,
    supportsTracking: true,
  };

  private sentList: NotificationResult[] = [];

  public async send(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      id: crypto.randomUUID(),
      channel: this.channel,
      provider: this.name,
      providerMessageId: `mem_${Date.now()}`,
      status: 'Delivered',
      sentAt: new Date(),
      deliveredAt: new Date(),
    };

    this.sentList.push(result);
    DeliveryTracker.track(result);
    return result;
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class NoopNotificationProvider implements INotificationProvider {
  constructor(public readonly channel: NotificationChannel = 'email') {}

  public readonly name = 'noop';
  public readonly capabilities: NotificationCapabilities = {
    supportsHtml: false,
    supportsAttachments: false,
    supportsScheduling: false,
    supportsTemplates: false,
    supportsBulk: false,
    supportsTracking: false,
  };

  public async send(_payload: NotificationPayload): Promise<NotificationResult> {
    return { id: 'noop', channel: this.channel, provider: 'noop', status: 'Sent' };
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class SmtpEmailProvider extends MemoryNotificationProvider {
  constructor() {
    super('email');
  }
}

export class TwilioSmsProvider extends MemoryNotificationProvider {
  constructor() {
    super('sms');
  }
}

export class FcmPushProvider extends MemoryNotificationProvider {
  constructor() {
    super('push');
  }
}

export class WebhookNotificationProvider extends MemoryNotificationProvider {
  constructor() {
    super('webhook');
  }
}
