import { QueryClient } from '@tanstack/react-query';
import { ENV } from '../../../config/env';
import { QUERY_KEYS } from '../../../api/query-keys';
import { RealtimeNotificationEvent, RealtimeSocketStatus } from '../../../types/notification.types';
import { extractApplicationId } from '../utils/notification-deep-link';

export type StatusListener = (status: RealtimeSocketStatus) => void;
export type NotificationEventListener = (event: RealtimeNotificationEvent) => void;

export class NotificationSocketManager {
  private static instance: NotificationSocketManager;
  private ws: WebSocket | null = null;
  private status: RealtimeSocketStatus = 'DISCONNECTED';
  private queryClient: QueryClient | null = null;
  private token: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 15000;
  private isExplicitlyClosed = false;
  private statusListeners: Set<StatusListener> = new Set();
  private eventListeners: Set<NotificationEventListener> = new Set();

  private constructor() {}

  public static getInstance(): NotificationSocketManager {
    if (!NotificationSocketManager.instance) {
      NotificationSocketManager.instance = new NotificationSocketManager();
    }
    return NotificationSocketManager.instance;
  }

  public setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  public getStatus(): RealtimeSocketStatus {
    return this.status;
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribeEvents(listener: NotificationEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private setStatus(newStatus: RealtimeSocketStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((l) => {
      try {
        l(newStatus);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  /**
   * Connect to WebSocket server using authenticated JWT token.
   * Token is NEVER logged or stored in unencrypted runtime logs.
   */
  public connect(token: string): void {
    if (!token || typeof token !== 'string') {
      this.disconnect();
      return;
    }

    this.token = token;
    this.isExplicitlyClosed = false;

    // Avoid duplicate connection if already connected/connecting
    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === 0)) {
      return;
    }

    this.cleanupSocket();

    try {
      this.setStatus(this.reconnectAttempts === 0 ? 'CONNECTING' : 'RECONNECTING');

      const wsUrl = `${ENV.WS_URL}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // On connection/reconnection, invalidate notifications and count to sync state missed while disconnected
        if (this.queryClient) {
          this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
          this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });
        }
      };

      socket.onmessage = (event) => {
        if (this.ws !== socket) return;
        this.handleIncomingMessage(event.data);
      };

      socket.onclose = (event) => {
        if (this.ws !== socket) return;
        this.cleanupHeartbeat();
        this.ws = null;
        this.setStatus('DISCONNECTED');

        // Do not auto-reconnect if closed normally or explicitly disconnected
        if (this.isExplicitlyClosed || event.code === 1000 || event.code === 4401) {
          return;
        }

        this.scheduleReconnect();
      };

      socket.onerror = () => {
        if (this.ws !== socket) return;
        // Silent error handling — onclose will trigger exponential backoff reconnect
      };
    } catch {
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  /**
   * Process and route incoming realtime messages with targeted query invalidation.
   */
  private handleIncomingMessage(rawData: string | ArrayBuffer): void {
    try {
      if (typeof rawData !== 'string') return;
      const parsed: RealtimeNotificationEvent = JSON.parse(rawData);

      if (!parsed || typeof parsed !== 'object' || !parsed.type) return;

      // Broadcast to in-app listeners
      this.eventListeners.forEach((l) => {
        try {
          l(parsed);
        } catch {
          // Ignore subscriber error
        }
      });

      if (!this.queryClient) return;

      if (parsed.type === 'notification.created') {
        const notif = parsed.data;
        // Invalidate notification queries
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });

        // Targeted domain synchronization for application updates
        const appId = notif ? extractApplicationId(notif) : null;
        if (appId) {
          this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.detail(appId) });
          this.queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.timeline.byApplication(appId),
          });
          this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.all });
          this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.mine() });

          const notifType = String(notif.type || '').toLowerCase();
          if (notifType.includes('document')) {
            this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents.list(appId) });
          } else if (notifType.includes('fee') || notifType.includes('payment')) {
            this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fees.summary(appId) });
            this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fees.receipt(appId) });
          } else if (notifType.includes('assessment') || notifType.includes('exam')) {
            this.queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.assessment.byApplication(appId),
            });
          } else if (notifType.includes('decision') || notifType.includes('offer')) {
            this.queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.decision.byApplication(appId),
            });
          }
        }
      } else if (parsed.type === 'notification.updated' || parsed.type === 'notification.deleted') {
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });
      }
    } catch {
      // Ignore malformed or unparseable JSON messages safely
    }
  }

  /**
   * Schedule automatic reconnection with exponential backoff and jitter.
   */
  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed || !this.token) return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, max 15s + random jitter
    const delay = Math.min(
      1000 * Math.pow(1.5, this.reconnectAttempts) + Math.random() * 500,
      this.maxReconnectDelay,
    );
    this.reconnectAttempts += 1;
    this.setStatus('RECONNECTING');

    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed && this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Heartbeat to keep connection alive and detect dropped connections.
   */
  private startHeartbeat(): void {
    this.cleanupHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // Socket write failed
        }
      }
    }, 25000);
  }

  private cleanupHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanupSocket(reason = 'Re-establishing socket'): void {
    this.cleanupHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, reason);
      } catch {
        // Ignore close error
      }
      this.ws = null;
    }
  }

  /**
   * Pause connection (e.g. app went to background)
   */
  public pause(): void {
    this.cleanupSocket('App backgrounded');
    this.setStatus('DISCONNECTED');
  }

  /**
   * Resume connection (e.g. app returned to foreground)
   */
  public resume(): void {
    if (this.token && !this.isExplicitlyClosed) {
      this.reconnectAttempts = 0;
      this.connect(this.token);
    }
  }

  /**
   * Explicitly disconnect on user logout or session termination.
   */
  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.token = null;
    this.reconnectAttempts = 0;
    this.cleanupSocket('User logged out');
    this.setStatus('DISCONNECTED');
  }
}

export const notificationSocket = NotificationSocketManager.getInstance();
