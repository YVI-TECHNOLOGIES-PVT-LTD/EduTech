import { NotificationResult } from '../contracts/notification.contracts';
import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export class DeliveryTracker {
  private static metrics = MetricsRegistry.getInstance();

  public static track(result: NotificationResult): void {
    this.metrics.incrementCounter(
      `notification_${result.channel}_${result.status.toLowerCase()}_total`,
    );
    loggerService.info(
      `📢 [Notification ${result.status}] Channel: ${result.channel}, Recipient: ${result.id}`,
      {
        notificationId: result.id,
        channel: result.channel,
        provider: result.provider,
        status: result.status,
      },
    );
  }
}
