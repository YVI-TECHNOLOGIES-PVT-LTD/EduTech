import { NotificationFactory } from '../factory/notification.factory';
import { NotificationChannel } from '../contracts/notification.contracts';

export interface NotificationHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  channels: Record<NotificationChannel, { provider: string; ping: boolean; latencyMs: number }>;
  timestamp: string;
}

export class NotificationHealthService {
  public static async getStatus(): Promise<NotificationHealthStatus> {
    const factory = new NotificationFactory();
    const channelsList: NotificationChannel[] = ['email', 'sms', 'push', 'webhook'];
    const channelStatus: Record<string, any> = {};

    let allOk = true;

    for (const channel of channelsList) {
      const provider = factory.createProvider(channel);
      const start = process.hrtime.bigint();
      let isPingOk = false;
      try {
        isPingOk = await provider.ping();
      } catch {
        isPingOk = false;
      }
      const end = process.hrtime.bigint();
      const latencyMs = Math.round(Number(end - start) / 100000) / 10;

      if (!isPingOk) allOk = false;

      channelStatus[channel] = {
        provider: provider.name,
        ping: isPingOk,
        latencyMs,
      };
    }

    return {
      status: allOk ? 'ok' : 'degraded',
      channels: channelStatus as any,
      timestamp: new Date().toISOString(),
    };
  }
}
