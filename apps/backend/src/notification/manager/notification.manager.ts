import {
  INotificationProvider,
  NotificationPayload,
  NotificationResult,
} from '../contracts/notification.contracts';
import { NotificationFactory } from '../factory/notification.factory';
import { RoutingEngine } from '../routing/routing.engine';
import { TemplateEngine, TemplateRegistry } from '../templates/notification.templates';
import { queueManager } from '../../queue/manager/queue.manager';

export class NotificationManager {
  private static instance: NotificationManager;
  private factory = new NotificationFactory();

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async send(payload: NotificationPayload): Promise<NotificationResult> {
    let finalPayload = { ...payload };

    // Resolve Template if specified
    if (payload.templateId) {
      const template = TemplateRegistry.getTemplate(payload.templateId, payload.templateVersion);
      if (template) {
        const rendered = TemplateEngine.render(template, payload.variables);
        finalPayload.subject = rendered.subject || payload.subject;
        finalPayload.body = rendered.body;
        finalPayload.channel = finalPayload.channel || template.channel;
      }
    }

    const targetChannel = RoutingEngine.selectChannel(finalPayload);
    const provider = this.factory.createProvider(targetChannel);
    return provider.send(finalPayload);
  }

  public async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)));
  }

  public async sendAsync(payload: NotificationPayload): Promise<void> {
    await queueManager.enqueue('notification:dispatch', 'send_notification', payload);
  }
}

export const notificationManager = NotificationManager.getInstance();
