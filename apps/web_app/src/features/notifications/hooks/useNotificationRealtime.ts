import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { API_CONFIG } from '@/config/api';
import { apiSlice } from '@/app/store/apiSlice';

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface RealtimeNotificationMessage {
  type:
    | 'notification.created'
    | 'notification.updated'
    | 'notification.deleted'
    | 'connection.ack'
    | 'pong';
  data?: any;
  userId?: string;
  orgId?: string;
  timestamp?: string;
}

export function useNotificationRealtime() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const isAuthenticated = authState.isAuthenticated;
  const accessToken =
    authState.accessToken ||
    (() => {
      try {
        return localStorage.getItem(API_CONFIG.tokenKeys.accessToken);
      } catch {
        return null;
      }
    })();

  const [status, setStatus] = useState<RealtimeStatus>('DISCONNECTED');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const getWsUrl = useCallback(() => {
    try {
      const baseUrl = API_CONFIG.baseUrl || 'http://127.0.0.1:3000/api';
      const wsBase = baseUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
      return `${wsBase}/ws/notifications`;
    } catch {
      return 'ws://127.0.0.1:3000/ws/notifications';
    }
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setStatus('DISCONNECTED');
      return;
    }

    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    try {
      setStatus(attemptsRef.current === 0 ? 'CONNECTING' : 'RECONNECTING');
      const wsEndpoint = `${getWsUrl()}?token=${encodeURIComponent(accessToken)}`;
      const ws = new WebSocket(wsEndpoint);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus('CONNECTED');
        attemptsRef.current = 0;
        // Invalidate tags on connect/reconnect so missed notifications while offline are loaded from DB
        dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload: RealtimeNotificationMessage = JSON.parse(event.data);
          if (payload.type === 'notification.created') {
            // Update RTK Query cache with zero full-page reload
            dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']));
          } else if (
            payload.type === 'notification.updated' ||
            payload.type === 'notification.deleted'
          ) {
            dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']));
          }
        } catch {
          // Ignore invalid messages
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        socketRef.current = null;
        setStatus('DISCONNECTED');

        // Do not auto-reconnect if closed normally or unauthorized
        if (event.code === 1000 || event.code === 4401 || !isAuthenticated) {
          return;
        }

        // Exponential backoff reconnect: 1s, 2s, 4s, up to 15s max
        const backoffMs = Math.min(1000 * Math.pow(1.5, attemptsRef.current), 15000);
        attemptsRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && isAuthenticated) {
            connect();
          }
        }, backoffMs);
      };

      ws.onerror = () => {
        // Silently handle errors, onclose will trigger backoff retry
      };
    } catch {
      setStatus('DISCONNECTED');
    }
  }, [isAuthenticated, accessToken, getWsUrl, dispatch]);

  useEffect(() => {
    isMountedRef.current = true;
    if (isAuthenticated && accessToken) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close(1000, 'User logged out');
        socketRef.current = null;
      }
      setStatus('DISCONNECTED');
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken, connect]);

  return { status };
}
