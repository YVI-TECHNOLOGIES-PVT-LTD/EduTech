import { Server as HttpServer, IncomingMessage } from 'http';
import { Socket } from 'net';
import { URL } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { sessionService, UserProfile } from '../../../auth/session.service';
import { logger } from '../../../utils/logger';

export interface RealtimeNotificationEvent {
  type: 'notification.created' | 'notification.updated' | 'notification.deleted' | 'connection.ack';
  data?: any;
  userId?: string;
  orgId?: string;
  timestamp?: string;
}

export class RealtimeNotificationServer {
  private static instance: RealtimeNotificationServer;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  public static getInstance(): RealtimeNotificationServer {
    if (!RealtimeNotificationServer.instance) {
      RealtimeNotificationServer.instance = new RealtimeNotificationServer();
    }
    return RealtimeNotificationServer.instance;
  }

  /**
   * Initialize WebSocket server and bind to HTTP upgrade events
   */
  public init(server: HttpServer): void {
    if (this.wss) {
      logger.warn('[RealtimeNotifications] WebSocketServer already initialized.');
      return;
    }

    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (req: IncomingMessage, socket: Socket, head: Buffer) => {
      try {
        const reqUrl = req.url || '';
        const parsedUrl = new URL(reqUrl, 'http://127.0.0.1');
        const pathname = parsedUrl.pathname;

        // Only handle notification websocket paths
        if (pathname !== '/ws/notifications' && pathname !== '/api/v1/notifications/ws') {
          return;
        }

        // Extract token from query params or Authorization header or Sec-WebSocket-Protocol
        let token = parsedUrl.searchParams.get('token');
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        }
        if (!token && req.headers['sec-websocket-protocol']) {
          token = req.headers['sec-websocket-protocol'].split(',')[0].trim();
        }

        if (!token) {
          logger.warn('[RealtimeNotifications] WebSocket connection rejected: Missing token');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const userProfile = await sessionService.validateSession(token);
        if (!userProfile || !userProfile.id || !userProfile.org_id) {
          logger.warn(
            '[RealtimeNotifications] WebSocket connection rejected: Invalid or expired session token',
          );
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss?.handleUpgrade(req, socket, head, (ws: WebSocket) => {
          this.handleConnection(ws, userProfile);
        });
      } catch (err: any) {
        logger.error('[RealtimeNotifications] Upgrade error:', {
          error: err?.message || String(err),
        });
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      }
    });

    // Start 30-second ping/pong heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.pingClients();
    }, 30000);

    logger.info(
      '[RealtimeNotifications] WebSocket server initialized on paths /ws/notifications and /api/v1/notifications/ws',
    );
  }

  private handleConnection(ws: WebSocket, user: UserProfile): void {
    const clientKey = `${user.org_id}:${user.id}`;
    (ws as any).isAlive = true;
    (ws as any).user = user;

    if (!this.clients.has(clientKey)) {
      this.clients.set(clientKey, new Set());
    }
    this.clients.get(clientKey)!.add(ws);

    logger.info(
      `[RealtimeNotifications] Client connected: user=${user.id}, org=${user.org_id} (active sockets: ${this.clients.get(clientKey)!.size})`,
    );

    // Send connection acknowledgment
    const ackPayload: RealtimeNotificationEvent = {
      type: 'connection.ack',
      userId: user.id,
      orgId: user.org_id,
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(ackPayload));

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (data: Buffer | string) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch {
        // Ignore unparseable client messages
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      const set = this.clients.get(clientKey);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          this.clients.delete(clientKey);
        }
      }
      logger.info(
        `[RealtimeNotifications] Client disconnected: user=${user.id}, org=${user.org_id} (code: ${code}, reason: ${reason?.toString() || 'none'})`,
      );
    });

    ws.on('error', (err: Error) => {
      logger.warn(`[RealtimeNotifications] Socket error for user ${user.id}:`, {
        error: err.message,
      });
    });
  }

  /**
   * Broadcast notification payload strictly to the intended recipient inside the authorized tenant
   */
  public sendToUser(orgId: string, userId: string, payload: RealtimeNotificationEvent): void {
    try {
      const clientKey = `${orgId}:${userId}`;
      const userSockets = this.clients.get(clientKey);

      if (!userSockets || userSockets.size === 0) {
        logger.debug(
          `[RealtimeNotifications] No active realtime sockets for user=${userId}, org=${orgId}. Notification will be loaded on next REST fetch.`,
        );
        return;
      }

      const messageStr = JSON.stringify({
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      });

      let sentCount = 0;
      for (const ws of userSockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
          sentCount++;
        }
      }

      logger.info(
        `[RealtimeNotifications] Dispatched ${payload.type} to user=${userId}, org=${orgId} across ${sentCount} open socket(s).`,
      );
    } catch (err: any) {
      logger.error(`[RealtimeNotifications] Failed to dispatch realtime event:`, {
        error: err?.message || String(err),
      });
    }
  }

  private pingClients(): void {
    for (const [key, sockets] of this.clients.entries()) {
      for (const ws of sockets) {
        if (!(ws as any).isAlive) {
          logger.debug(`[RealtimeNotifications] Terminating inactive socket for key=${key}`);
          ws.terminate();
          sockets.delete(ws);
        } else {
          (ws as any).isAlive = false;
          ws.ping();
        }
      }
      if (sockets.size === 0) {
        this.clients.delete(key);
      }
    }
  }

  public getConnectedCount(): number {
    let total = 0;
    for (const sockets of this.clients.values()) {
      total += sockets.size;
    }
    return total;
  }

  public close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
    logger.info('[RealtimeNotifications] WebSocket server closed.');
  }
}

export const realtimeNotificationServer = RealtimeNotificationServer.getInstance();
