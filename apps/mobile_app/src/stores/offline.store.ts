import { create } from 'zustand';

export interface PendingOfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
  timestamp: number;
}

interface OfflineState {
  isConnected: boolean;
  pendingQueue: PendingOfflineAction[];
  setConnected: (isConnected: boolean) => void;
  addToQueue: (action: Omit<PendingOfflineAction, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isConnected: true,
  pendingQueue: [],
  setConnected: (isConnected) => set({ isConnected }),
  addToQueue: (action) =>
    set((state) => ({
      pendingQueue: [
        ...state.pendingQueue,
        { ...action, id: Math.random().toString(), timestamp: Date.now() },
      ],
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      pendingQueue: state.pendingQueue.filter((item) => item.id !== id),
    })),
  clearQueue: () => set({ pendingQueue: [] }),
}));
