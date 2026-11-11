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

export const MAX_REALTIME_RECONNECT_ATTEMPTS = 5;
export const MAX_INITIAL_HANDSHAKE_ATTEMPTS = 3;

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
  const isInitializing = authState.isInitializing;
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
  const cancelledSocketsRef = useRef<WeakSet<WebSocket>>(new WeakSet());
  const startupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef<number>(0);
  const hasConnectedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const activeTokenRef = useRef<string | null>(null);

  const safeTeardownSocket = useCallback((ws: WebSocket | null, reason: string) => {
    if (!ws) return;
    if (ws.readyState === WebSocket.CONNECTING) {
      // Never abort a CONNECTING WebSocket synchronously; let onopen close it gracefully
      // to avoid browser "Connection interrupted while page is loading" errors under StrictMode.
      cancelledSocketsRef.current.add(ws);
      return;
    }
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.close(1000, reason);
      } catch {
        // Ignore close errors during teardown
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || isInitializing || !accessToken) {
      if (socketRef.current) {
        safeTeardownSocket(socketRef.current, 'User logged out');
        socketRef.current = null;
      }
      activeTokenRef.current = null;
      setStatus('DISCONNECTED');
      return;
    }

    const existing = socketRef.current;
    if (
      existing &&
      activeTokenRef.current === accessToken &&
      (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (existing) {
      safeTeardownSocket(existing, 'Replacing connection');
      socketRef.current = null;
    }

    try {
      setStatus(attemptsRef.current === 0 ? 'CONNECTING' : 'RECONNECTING');
      const wsUrl = getWebSocketBaseUrl();
      const wsEndpoint = `${wsUrl}?token=${encodeURIComponent(accessToken)}`;
      const ws = new WebSocket(wsEndpoint);
      socketRef.current = ws;
      activeTokenRef.current = accessToken;

      ws.onopen = () => {
        if (
          !isMountedRef.current ||
          cancelledSocketsRef.current.has(ws) ||
          socketRef.current !== ws
        ) {
          try {
            ws.close(1000, 'Cancelled after handshake');
          } catch {
            // Ignore close errors
          }
          return;
        }
        hasConnectedRef.current = true;
        setStatus('CONNECTED');
        attemptsRef.current = 0;
        // Invalidate tags on connect/reconnect so missed notifications while offline are loaded from DB
        dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current || cancelledSocketsRef.current.has(ws)) return;
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
        if (cancelledSocketsRef.current.has(ws) || socketRef.current !== ws) {
          return;
        }
        socketRef.current = null;
        if (!isMountedRef.current) return;
        setStatus('DISCONNECTED');

        // Do not auto-reconnect if closed normally, unauthorized/policy-rejected, or unauthenticated
        if (
          event.code === 1000 ||
          event.code === 1008 ||
          event.code === 4401 ||
          event.code === 4403 ||
          !isAuthenticated ||
          isInitializing ||
          !accessToken
        ) {
          return;
        }

        const maxAttempts = hasConnectedRef.current
          ? MAX_REALTIME_RECONNECT_ATTEMPTS
          : MAX_INITIAL_HANDSHAKE_ATTEMPTS;
        if (attemptsRef.current >= maxAttempts) {
          return;
        }

        // Exponential backoff reconnect: 1s, 1.5s, 2.25s, ... up to 15s max
        const backoffMs = Math.min(1000 * Math.pow(1.5, attemptsRef.current), 15000);
        attemptsRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && isAuthenticated && !isInitializing && accessToken) {
            connect();
          }
        }, backoffMs);
      };

      ws.onerror = () => {
        // Handled cleanly in onclose with bounded backoff
      };
    } catch {
      setStatus('DISCONNECTED');
    }
  }, [isAuthenticated, isInitializing, accessToken, dispatch, safeTeardownSocket]);

  useEffect(() => {
    isMountedRef.current = true;
    attemptsRef.current = 0;
    hasConnectedRef.current = false;

    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }

    if (isAuthenticated && !isInitializing && accessToken) {
      // Short startup debounce avoids aborting initial handshake on React StrictMode mount/unmount cycles.
      startupTimeoutRef.current = setTimeout(() => {
        startupTimeoutRef.current = null;
        if (isMountedRef.current) {
          connect();
        }
      }, 60);
    } else {
      if (socketRef.current) {
        safeTeardownSocket(socketRef.current, 'User logged out');
        socketRef.current = null;
      }
      activeTokenRef.current = null;
      setStatus('DISCONNECTED');
    }

    return () => {
      isMountedRef.current = false;
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        safeTeardownSocket(socketRef.current, 'Component unmounted');
        socketRef.current = null;
      }
      activeTokenRef.current = null;
    };
  }, [isAuthenticated, isInitializing, accessToken, connect, safeTeardownSocket]);

  return { status };
}
