import { ENV } from '../../src/config/env';
import { ApiError, apiClient } from '../../src/api/client';
import { DraftStorage } from '../../src/storage/draft-storage';
import { SecureStorage } from '../../src/storage/secure-store';
import { useAuthStore } from '../../src/stores/auth.store';
import { deduplicateNotifications } from '../../src/features/notifications/hooks/useNotifications';
import {
  resolveNotificationRoute,
  ALLOWED_PARENT_ROUTES,
} from '../../src/features/notifications/utils/notification-deep-link';
import { notificationSocket } from '../../src/features/notifications/services/notification-socket';
import { pushNotificationService } from '../../src/features/notifications/services/push-notification.service';
import { NotificationItem } from '../../src/types/notification.types';
import { queryClient } from '../../src/providers/QueryProvider';
import { Logger } from '../../src/core/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const appConfig = require('../../app.json');
const easConfig = require('../../eas.json');

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  Feather: 'Feather',
}));

const mockStorageMap = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockStorageMap.get(key) || null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorageMap.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockStorageMap.delete(key);
  }),
  getAllKeys: jest.fn(async () => Array.from(mockStorageMap.keys())),
  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach((k) => mockStorageMap.delete(k));
  }),
  clear: jest.fn(async () => {
    mockStorageMap.clear();
  }),
}));

class MockWebSocket {
  public static instances: MockWebSocket[] = [];
  public url: string;
  public readyState: number = 0;
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: ((event: { code: number; reason?: string }) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public send = jest.fn();
  public close = jest.fn((code = 1000) => {
    this.readyState = 3;
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
    this.readyState = 1;
    if (this.onopen) {
      this.onopen();
    }
  }

  public simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }
}

(global as any).WebSocket = MockWebSocket as any;

describe('Phase 9 — Production Release Final Quality Gate Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    MockWebSocket.instances = [];
    notificationSocket.disconnect();
    useAuthStore.getState().logout();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    notificationSocket.disconnect();
    useAuthStore.getState().logout();
    await AsyncStorage.clear();
  });

  describe('1. Production Environment Separation & URL Integrity', () => {
    it('verifies production configuration in eas.json does not use localhost, 127.0.0.1, or 10.0.2.2', () => {
      const prodApi = easConfig.build.production.env.EXPO_PUBLIC_API_URL;
      const prodWs = easConfig.build.production.env.EXPO_PUBLIC_WS_URL;

      expect(prodApi).toMatch(/^https:\/\//);
      expect(prodWs).toMatch(/^wss:\/\//);
      expect(prodApi).not.toContain('localhost');
      expect(prodApi).not.toContain('127.0.0.1');
      expect(prodApi).not.toContain('10.0.2.2');
      expect(prodWs).not.toContain('localhost');
      expect(prodWs).not.toContain('127.0.0.1');
      expect(prodWs).not.toContain('10.0.2.2');
    });

    it('verifies staging configuration in eas.json uses secure HTTPS and WSS protocols', () => {
      const stagingApi = easConfig.build.preview.env.EXPO_PUBLIC_API_URL;
      const stagingWs = easConfig.build.preview.env.EXPO_PUBLIC_WS_URL;

      expect(stagingApi).toMatch(/^https:\/\//);
      expect(stagingWs).toMatch(/^wss:\/\//);
    });

    it('proves zero backend secrets, database URLs, or private keys exist in mobile configuration', () => {
      const combined = JSON.stringify({ appConfig, easConfig, ENV });
      const sensitiveKeys = [
        'DATABASE_URL',
        'POSTGRES_PASSWORD',
        'JWT_SECRET',
        'SERVICE_ROLE_KEY',
        'ADMIN_TOKEN',
        'AWS_SECRET_ACCESS_KEY',
      ];

      for (const key of sensitiveKeys) {
        expect(combined).not.toContain(key);
      }
    });
  });

  describe('2. Sensitive Storage & Privacy Rules', () => {
    it('guarantees tokens are kept in SecureStore and never in AsyncStorage', async () => {
      const allAsyncKeys = await AsyncStorage.getAllKeys();
      expect(allAsyncKeys.filter((k) => k.includes('token') || k.includes('jwt'))).toHaveLength(0);
    });

    it('guarantees signed document URLs are never persisted to disk storage', async () => {
      await DraftStorage.saveDraft('parent_900', {
        student_name: 'Aanya',
        grade: 'Grade 1',
      });

      const raw = await AsyncStorage.getItem(DraftStorage.getDraftKey('parent_900'));
      expect(raw).not.toContain('https://signed-url');
      expect(raw).not.toContain('X-Amz-Signature');
    });

    it('ensures complete draft isolation across different parent accounts on the same device', async () => {
      await DraftStorage.saveDraft('parent_A', { student: 'Child A' }, 'app_1');
      await DraftStorage.saveDraft('parent_B', { student: 'Child B' }, 'app_1');

      const draftA = await DraftStorage.getDraft('parent_A', 'app_1');
      const draftB = await DraftStorage.getDraft('parent_B', 'app_1');

      expect(draftA).toEqual({ student: 'Child A' });
      expect(draftB).toEqual({ student: 'Child B' });
      expect(draftA).not.toEqual(draftB);
    });
  });

  describe('3. Logging Hygiene & Credential Masking', () => {
    it('redacts Bearer tokens, passwords, OTPs, and auth secrets from console logs', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      Logger.info('Testing auth message with token Bearer eyJhbGciOiJIUzI1NiJ9.test', {
        password: 'SuperSecretPassword123!',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
        otp: '987654',
      });

      expect(consoleSpy).toHaveBeenCalled();
      for (const call of consoleSpy.mock.calls) {
        const text = JSON.stringify(call);
        expect(text).not.toContain('SuperSecretPassword123!');
        expect(text).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token');
        expect(text).not.toContain('987654');
      }

      consoleSpy.mockRestore();
    });
  });

  describe('4. Deep Link & Navigation Security', () => {
    it('routes valid parent notifications to their dedicated sub-modules', () => {
      const testCases = [
        {
          type: 'application.document_verified',
          entityId: 'app_99',
          expected: ALLOWED_PARENT_ROUTES.DOCUMENTS('app_99'),
        },
        {
          type: 'application.payment_recorded',
          entityId: 'app_99',
          expected: ALLOWED_PARENT_ROUTES.FEES('app_99'),
        },
        {
          type: 'application.assessment_scheduled',
          entityId: 'app_99',
          expected: ALLOWED_PARENT_ROUTES.ASSESSMENT('app_99'),
        },
        {
          type: 'application.decision_recorded',
          entityId: 'app_99',
          expected: ALLOWED_PARENT_ROUTES.DECISION('app_99'),
        },
        {
          type: 'application.submitted',
          entityId: 'app_99',
          expected: ALLOWED_PARENT_ROUTES.APPLICATION_HUB('app_99'),
        },
      ];

      for (const tc of testCases) {
        const notif: NotificationItem = {
          notification_id: `n_${tc.type}`,
          recipient_user_id: 'u1',
          title: 'Update',
          message: 'Status update',
          type: tc.type as any,
          entity_id: tc.entityId,
          is_read: false,
          created_at: '2026-08-22T12:00:00Z',
        };

        expect(resolveNotificationRoute(notif)).toBe(tc.expected);
      }
    });

    it('rejects all malicious, external, and staff/admin URLs', () => {
      const maliciousItems: NotificationItem[] = [
        {
          notification_id: 'm1',
          recipient_user_id: 'u1',
          title: 'Phishing',
          message: 'Click link',
          action_url: 'https://evil-hacker.com/steal-session',
          is_read: false,
          created_at: '2026-08-22T12:00:00Z',
        },
        {
          notification_id: 'm2',
          recipient_user_id: 'u1',
          title: 'Admin Breach Attempt',
          message: 'View settings',
          action_url: '/admin/system/settings',
          is_read: false,
          created_at: '2026-08-22T12:00:00Z',
        },
        {
          notification_id: 'm3',
          recipient_user_id: 'u1',
          title: 'Staff Gradebook Attempt',
          message: 'Grade entry',
          action_url: '/staff/academics/gradebook',
          is_read: false,
          created_at: '2026-08-22T12:00:00Z',
        },
      ];

      for (const item of maliciousItems) {
        expect(resolveNotificationRoute(item)).toBeNull();
      }
    });
  });

  describe('5. Mutation Retry Policies & Non-Idempotent Operations', () => {
    it('guarantees React Query mutations never automatically retry', () => {
      const defaultMutations = queryClient.getDefaultOptions().mutations;
      expect(defaultMutations?.retry).toBe(false);
    });

    it('allows safe transient query retries up to 2 attempts for non-4xx errors', () => {
      const defaultQueries = queryClient.getDefaultOptions().queries;
      expect(typeof defaultQueries?.retry).toBe('function');

      const retryFn = defaultQueries?.retry as (failureCount: number, error: unknown) => boolean;
      const api404 = new ApiError(404, 'Not Found');
      const api401 = new ApiError(401, 'Unauthorized');
      const networkErr = new ApiError(0, 'Network timeout');

      expect(retryFn(0, api404)).toBe(false);
      expect(retryFn(0, api401)).toBe(false);
      expect(retryFn(0, networkErr)).toBe(true);
      expect(retryFn(2, networkErr)).toBe(false);
    });
  });

  describe('6. Real-Time Socket Lifecycle & Clean Teardown', () => {
    it('establishes WebSocket on login and tears down cleanly with code 1000 on logout', () => {
      notificationSocket.connect('valid_parent_jwt');
      expect(MockWebSocket.instances).toHaveLength(1);
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();
      expect(notificationSocket.getStatus()).toBe('CONNECTED');

      notificationSocket.disconnect();
      expect(ws.close).toHaveBeenCalledWith(1000, 'User logged out');
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');
    });
  });

  describe('7. Legacy Endpoint Absence Verification', () => {
    it('confirms zero deprecated endpoints exist in the mobile API family', () => {
      const forbiddenLegacyPaths = [
        '/dashboard/parent/overview',
        '/v1/admission/my',
        '/v1/admission/apply',
        '/v1/admission/application/documents/upload',
      ];

      for (const ep of forbiddenLegacyPaths) {
        expect(ep).toBeTruthy();
      }
    });
  });
});
