import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { API_CONFIG } from '@/config/api';
import { apiSlice } from '@/app/store/apiSlice';

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface RealtimeNotificationMessage {
  type: string;
  data?: any;
  userId?: string;
  orgId?: string;
  timestamp?: string;
}

export function getWebSocketBaseUrl(): string {
  try {
    const defaultHost =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : '127.0.0.1';
    const protocol =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    const baseUrl = API_CONFIG.baseUrl;
    if (baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'))) {
      const parsed = new URL(baseUrl);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostName =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
          ? defaultHost
          : parsed.hostname;
      const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '3000');
      return `${wsProtocol}//${hostName}:${port}/ws/notifications`;
    }

    if (baseUrl && baseUrl.startsWith('/')) {
      const host = typeof window !== 'undefined' ? window.location.host : '127.0.0.1:3000';
      return `${protocol}//${host}/ws/notifications`;
    }

    return `${protocol}//${defaultHost}:3000/ws/notifications`;
  } catch {
    return 'ws://127.0.0.1:3000/ws/notifications';
  }
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
      const wsUrl = getWebSocketBaseUrl();
      const wsEndpoint = `${wsUrl}?token=${encodeURIComponent(accessToken)}`;
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
          const type = payload?.type;

          if (
            type === 'notification.created' ||
            type === 'notification.updated' ||
            type === 'notification.deleted'
          ) {
            dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']));
          } else if (
            type === 'application.created' ||
            type === 'application.updated' ||
            type === 'application.status_changed' ||
            type === 'application.approved' ||
            type === 'application.rejected' ||
            type === 'application.deleted' ||
            type === 'application.document_uploaded' ||
            type === 'application.document_verified'
          ) {
            dispatch(apiSlice.util.invalidateTags(['Application', 'Lead']));
          } else if (type === 'application.assessment_recorded') {
            dispatch(apiSlice.util.invalidateTags(['Application', 'Assessment', 'Lead']));
          } else if (type === 'application.decision_recorded') {
            dispatch(apiSlice.util.invalidateTags(['Application', 'Lead', 'Student']));
          } else if (type === 'application.payment_recorded') {
            dispatch(apiSlice.util.invalidateTags(['Application', 'FeePayment', 'Lead']));
          } else if (
            type === 'lead.created' ||
            type === 'lead.updated' ||
            type === 'lead.assigned' ||
            type === 'lead.status_changed' ||
            type === 'lead.qualified' ||
            type === 'lead.converted' ||
            type === 'lead.deleted' ||
            type === 'lead.activity_added'
          ) {
            dispatch(
              apiSlice.util.invalidateTags(['Lead', 'LeadActivity', 'CampusVisit', 'Application']),
            );
          } else if (
            type === 'student.created' ||
            type === 'student.updated' ||
            type === 'student.enrolled' ||
            type === 'student.section_assigned' ||
            type === 'student.parent_linked' ||
            type === 'student.status_changed' ||
            type === 'student.deleted'
          ) {
            dispatch(
              apiSlice.util.invalidateTags(['Student', 'Enrollment', 'Application', 'Lead']),
            );
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
  }, [isAuthenticated, accessToken, dispatch]);

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
