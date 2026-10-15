import { EventBus } from '../../../workflows/event-bus.service';
import { FinanceEventType, FinanceEventPayload } from '../events/finance.events';
import { FinanceNotificationService } from '../services/FinanceNotificationService';
import { logger } from '../../../utils/logger';

export class FinanceNotificationSubscriber {
  private static registered = false;

  public static register(): void {
    if (this.registered) return;
    this.registered = true;

    logger.info('[FinanceNotificationSubscriber] Registering Finance domain event listeners...');

    const financeEvents = Object.values(FinanceEventType);

    for (const eventName of financeEvents) {
      EventBus.subscribe(eventName, async (payload: FinanceEventPayload) => {
        try {
          await FinanceNotificationService.handleEvent(payload);
        } catch (err: any) {
          logger.error(`[FinanceNotificationSubscriber] Failed to process ${eventName}:`, err);
        }
      });
    }
  }
}
