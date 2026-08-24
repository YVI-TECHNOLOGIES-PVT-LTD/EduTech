import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import { notificationSocket } from '../services/notification-socket';
import { RealtimeSocketStatus } from '../../../types/notification.types';

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const { isAuthenticated, tokens, isHydrating } = useAuthStore();
  const [status, setStatus] = useState<RealtimeSocketStatus>(notificationSocket.getStatus());

  // 1. Hook up QueryClient to Socket Manager
  useEffect(() => {
    notificationSocket.setQueryClient(queryClient);
  }, [queryClient]);

  // 2. Subscribe to status changes
  useEffect(() => {
    const unsubscribe = notificationSocket.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // 3. Connect / Disconnect based on Auth State
  useEffect(() => {
    if (isHydrating) return;

    if (isAuthenticated && tokens?.accessToken) {
      notificationSocket.connect(tokens.accessToken);
    } else {
      notificationSocket.disconnect();
    }
  }, [isAuthenticated, tokens?.accessToken, isHydrating]);

  // 4. AppState lifecycle management (foreground / background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (isAuthenticated && tokens?.accessToken) {
          notificationSocket.resume();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        notificationSocket.pause();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, tokens?.accessToken]);

  return { status };
}
