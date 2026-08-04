import { useOfflineStore } from '../../stores/offline.store';

export const useNetwork = () => {
  const isConnected = useOfflineStore((state) => state.isConnected);
  const pendingQueue = useOfflineStore((state) => state.pendingQueue);

  return {
    isConnected,
    pendingQueue,
  };
};
