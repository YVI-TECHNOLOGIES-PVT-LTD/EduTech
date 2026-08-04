import { useOfflineStore } from '../../stores/offline.store';

export class ConnectivityService {
  static setNetworkStatus(isConnected: boolean): void {
    useOfflineStore.getState().setConnected(isConnected);
  }

  static isOnline(): boolean {
    return useOfflineStore.getState().isConnected;
  }
}
