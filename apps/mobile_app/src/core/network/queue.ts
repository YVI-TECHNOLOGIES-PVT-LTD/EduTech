import { useOfflineStore } from '../../stores/offline.store';

export class OfflineQueue {
  static enqueue(action: { url: string; method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'; payload: any }): void {
    useOfflineStore.getState().addToQueue(action);
  }
}
