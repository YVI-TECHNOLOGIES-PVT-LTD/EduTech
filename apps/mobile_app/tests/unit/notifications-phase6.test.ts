import { notificationsApi } from '../../src/api/notifications.api';
import { apiClient } from '../../src/api/client';
import { deduplicateNotifications } from '../../src/features/notifications/hooks/useNotifications';
import {
  resolveNotificationRoute,
  extractApplicationId,
  ALLOWED_PARENT_ROUTES,
} from '../../src/features/notifications/utils/notification-deep-link';
import { notificationSocket } from '../../src/features/notifications/services/notification-socket';
import { NotificationItem } from '../../src/types/notification.types';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../src/api/query-keys';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  Feather: 'Feather',
}));

jest.mock('../../src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock WebSocket
class MockWebSocket {
  public static instances: MockWebSocket[] = [];
  public url: string;
  public readyState: number = 0; // CONNECTING
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: ((event: { code: number; reason?: string }) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public send = jest.fn();
  public close = jest.fn((code = 1000) => {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ code });
    }
  });

  constructor(url: string) {
    this.url = url;
    this.readyState = 0;
    MockWebSocket.instances.push(this);
  }

  public simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen();
    }
  }

  public simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }

  public simulateClose(code = 1000) {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose({ code });
    }
  }
}

(global as any).WebSocket = MockWebSocket as any;

describe('Phase 6 — Notifications, Real-Time Updates & Production Mobile Resilience Suites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockWebSocket.instances = [];
    notificationSocket.disconnect();
  });

  afterEach(() => {
    notificationSocket.disconnect();
  });

  describe('1. Notification REST API Layer', () => {
    it('1. notification list loads from GET /v1/notifications', async () => {
      const mockNotifs: NotificationItem[] = [
        {
          notification_id: 'notif-1',
          recipient_user_id: 'usr-1',
          title: 'Document Verified',
          message: 'Birth certificate approved',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        notifications: mockNotifs,
        total: 1,
        unreadCount: 1,
      });

      const list = await notificationsApi.list();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/notifications');
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe('Document Verified');
    });

    it('2. unread count loads from GET /v1/notifications/unread-count', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        count: 5,
      });

      const count = await notificationsApi.getUnreadCount();
      expect(apiClient.get).toHaveBeenCalledWith('/v1/notifications/unread-count');
      expect(count).toBe(5);
    });

    it('3. individual notification read triggers PATCH /v1/notifications/:id/read', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({
        notification_id: 'notif-1',
        is_read: true,
        read_at: '2026-08-22T11:00:00Z',
      });

      const res = await notificationsApi.markRead('notif-1');
      expect(apiClient.patch).toHaveBeenCalledWith('/v1/notifications/notif-1/read');
      expect(res.is_read).toBe(true);
    });

    it('4. mark all read triggers POST /v1/notifications/mark-all-read', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        count: 4,
      });

      const res = await notificationsApi.markAllRead();
      expect(apiClient.post).toHaveBeenCalledWith('/v1/notifications/mark-all-read');
      expect(res.count).toBe(4);
    });

    it('5. handles empty notification list correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        notifications: [],
        total: 0,
        unreadCount: 0,
      });

      const list = await notificationsApi.list();
      expect(list).toEqual([]);
    });

    it('6. handles notification API error gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(notificationsApi.list()).rejects.toThrow('Network connection failed');
    });
  });

  describe('2. Deduplication & Malformed Payload Handling', () => {
    it('14. handles malformed notification payload safely without throwing', () => {
      expect(extractApplicationId(null as any)).toBeNull();
      expect(extractApplicationId(undefined as any)).toBeNull();
      expect(extractApplicationId({} as any)).toBeNull();
      expect(resolveNotificationRoute(null as any)).toBeNull();
      expect(resolveNotificationRoute({} as any)).toBeNull();
    });

    it('15. suppresses duplicate notifications using canonical notification ID', () => {
      const items: NotificationItem[] = [
        {
          notification_id: 'notif-100',
          recipient_user_id: 'usr-1',
          title: 'Update 1',
          message: 'First',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
        {
          notification_id: 'notif-100', // duplicate ID
          recipient_user_id: 'usr-1',
          title: 'Update 1 Duplicate',
          message: 'Duplicate',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
        {
          notification_id: 'notif-200',
          recipient_user_id: 'usr-1',
          title: 'Update 2',
          message: 'Second',
          is_read: true,
          created_at: '2026-08-22T10:05:00Z',
        },
      ];

      const deduplicated = deduplicateNotifications(items);
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated[0].notification_id).toBe('notif-100');
      expect(deduplicated[1].notification_id).toBe('notif-200');
    });
  });

  describe('3. Notification Deep-Linking & Security Allowlist', () => {
    it('8. resolves application hub deep link', () => {
      const notif: NotificationItem = {
        notification_id: 'n-1',
        recipient_user_id: 'u-1',
        title: 'Status Updated',
        message: 'Under review',
        type: 'application.status_changed',
        entity_id: 'app-999',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(notif);
      expect(route).toBe(ALLOWED_PARENT_ROUTES.APPLICATION_HUB('app-999'));
    });

    it('9. resolves document center deep link for document verification events', () => {
      const notif: NotificationItem = {
        notification_id: 'n-2',
        recipient_user_id: 'u-1',
        title: 'Document Verified',
        message: 'Aadhaar verified',
        type: 'application.document_verified',
        entity_id: 'app-999',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(notif);
      expect(route).toBe(ALLOWED_PARENT_ROUTES.DOCUMENTS('app-999'));
    });

    it('10. resolves fee statement deep link for payment events', () => {
      const notif: NotificationItem = {
        notification_id: 'n-3',
        recipient_user_id: 'u-1',
        title: 'Payment Received',
        message: 'Fee settled',
        type: 'application.payment_recorded',
        entity_id: 'app-999',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(notif);
      expect(route).toBe(ALLOWED_PARENT_ROUTES.FEES('app-999'));
    });

    it('11. resolves assessment deep link for evaluation events', () => {
      const notif: NotificationItem = {
        notification_id: 'n-4',
        recipient_user_id: 'u-1',
        title: 'Assessment Scheduled',
        message: 'Entrance exam on Sept 1',
        type: 'assessment.scheduled',
        metadata: { application_id: 'app-999' },
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(notif);
      expect(route).toBe(ALLOWED_PARENT_ROUTES.ASSESSMENT('app-999'));
    });

    it('12. resolves decision deep link for admission decision events', () => {
      const notif: NotificationItem = {
        notification_id: 'n-5',
        recipient_user_id: 'u-1',
        title: 'Decision Released',
        message: 'Offer letter ready',
        type: 'application.decision_recorded',
        entity_id: 'app-999',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(notif);
      expect(route).toBe(ALLOWED_PARENT_ROUTES.DECISION('app-999'));
    });

    it('7. returns application hub fallback if unknown notification type contains an application_id', () => {
      const notif: NotificationItem = {
        notification_id: 'n-6',
        recipient_user_id: 'u-1',
        title: 'Custom Event',
        message: 'Important info',
        type: 'custom.event_type',
        metadata: { application_id: 'app-999' },
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(notif);
      expect(route).toBe(ALLOWED_PARENT_ROUTES.APPLICATION_HUB('app-999'));
    });

    it('26. refuses navigation to arbitrary URLs or staff-only routes', () => {
      const maliciousNotif: NotificationItem = {
        notification_id: 'n-malicious',
        recipient_user_id: 'u-1',
        title: 'Malicious Notice',
        message: 'Click here',
        action_url: 'https://attacker.com/steal-creds',
        type: 'system.broadcast',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(maliciousNotif);
      expect(route).toBeNull(); // Strictly null — no navigation to unvetted external URL
    });

    it('27. refuses navigation to staff routes if supplied in payload', () => {
      const staffSpoofNotif: NotificationItem = {
        notification_id: 'n-staff',
        recipient_user_id: 'u-1',
        title: 'Staff Portal',
        message: 'Admin',
        action_url: '/admin/finance/settings',
        type: 'admin.settings',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const route = resolveNotificationRoute(staffSpoofNotif);
      expect(route).toBeNull(); // Not in allowed parent routes
    });
  });

  describe('4. Real-Time WebSocket Lifecycle & Cache Synchronization', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      notificationSocket.setQueryClient(queryClient);
      jest.spyOn(queryClient, 'invalidateQueries');
    });

    it('16. connects WebSocket with token after authentication', () => {
      notificationSocket.connect('valid-jwt-token');

      expect(MockWebSocket.instances).toHaveLength(1);
      const socket = MockWebSocket.instances[0];
      expect(socket.url).toContain('token=valid-jwt-token');
      expect(notificationSocket.getStatus()).toBe('CONNECTING');

      socket.simulateOpen();
      expect(notificationSocket.getStatus()).toBe('CONNECTED');
    });

    it('17. does not connect while logged out or with empty token', () => {
      notificationSocket.connect('');
      expect(MockWebSocket.instances).toHaveLength(0);
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');
    });

    it('18. disconnects WebSocket cleanly on logout', () => {
      notificationSocket.connect('valid-jwt-token');
      const socket = MockWebSocket.instances[0];
      socket.simulateOpen();

      notificationSocket.disconnect();
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');
      expect(socket.close).toHaveBeenCalled();
    });

    it('30. prevents duplicate concurrent WebSocket connections', () => {
      notificationSocket.connect('valid-jwt-token');
      const socket1 = MockWebSocket.instances[0];
      socket1.simulateOpen();

      notificationSocket.connect('valid-jwt-token'); // second connect call
      expect(MockWebSocket.instances).toHaveLength(1); // no duplicate socket created
    });

    it('20. safely ignores malformed or unparseable WebSocket message', () => {
      notificationSocket.connect('valid-jwt-token');
      const socket = MockWebSocket.instances[0];
      socket.simulateOpen();

      // Send raw unparseable string
      expect(() => {
        socket.simulateMessage('INVALID_JSON{{{');
      }).not.toThrow();

      // Send empty object
      expect(() => {
        socket.simulateMessage({});
      }).not.toThrow();
    });

    it('21. invalidates application details, timeline, and notification queries on application.status_changed event', () => {
      notificationSocket.connect('valid-jwt-token');
      const socket = MockWebSocket.instances[0];
      socket.simulateOpen();

      socket.simulateMessage({
        type: 'notification.created',
        data: {
          notification_id: 'n-live-1',
          recipient_user_id: 'usr-1',
          title: 'Status Changed',
          message: 'Your application is now under review',
          type: 'application.status_changed',
          entity_id: 'app-555',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.notifications.all,
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.notifications.unreadCount,
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.applications.detail('app-555'),
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.timeline.byApplication('app-555'),
      });
    });

    it('22. invalidates document checklist on document verification event', () => {
      notificationSocket.connect('valid-jwt-token');
      const socket = MockWebSocket.instances[0];
      socket.simulateOpen();

      socket.simulateMessage({
        type: 'notification.created',
        data: {
          notification_id: 'n-live-doc',
          recipient_user_id: 'usr-1',
          title: 'Document Approved',
          message: 'Birth certificate approved',
          type: 'application.document_verified',
          entity_id: 'app-555',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.documents.list('app-555'),
      });
    });

    it('23. handles pause and resume on app lifecycle state changes', () => {
      notificationSocket.connect('valid-jwt-token');
      const socket = MockWebSocket.instances[0];
      socket.simulateOpen();

      notificationSocket.pause();
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');

      notificationSocket.resume();
      expect(MockWebSocket.instances.length).toBeGreaterThan(1);
    });

    it('25. ensures access token is never logged to stdout during connection', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const secretToken = 'super-secret-jwt-token-12345';

      notificationSocket.connect(secretToken);

      for (const call of consoleSpy.mock.calls) {
        for (const arg of call) {
          expect(String(arg)).not.toContain(secretToken);
        }
      }
      consoleSpy.mockRestore();
    });
  });
});
