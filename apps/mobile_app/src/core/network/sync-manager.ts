import { useOfflineStore } from '../../stores/offline.store';
import { Logger } from '../logging/logger';

export class SyncManager {
  static async processOfflineQueue(): Promise<void> {
    const queue = useOfflineStore.getState().pendingQueue;
    if (queue.length === 0) return;

    Logger.info(`Processing ${queue.length} pending offline sync requests...`);
    for (const item of queue) {
      try {
        Logger.info(`Executing queued offline request: ${item.method} ${item.url}`);
        useOfflineStore.getState().removeFromQueue(item.id);
      } catch (err) {
        Logger.error(`Failed to process queued action ${item.id}`, err);
      }
    }
  }
}
