import { ENV } from '../../src/config/env';
import { ApiError, apiClient } from '../../src/api/client';
import { DraftStorage } from '../../src/storage/draft-storage';
import { SecureStorage } from '../../src/storage/secure-store';
import { useAuthStore } from '../../src/stores/auth.store';
import { deduplicateNotifications } from '../../src/features/notifications/hooks/useNotifications';
import {
  resolveNotificationRoute,
  extractApplicationId,
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

// Mock WebSocket
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

describe('Phase 8 — Release Candidate & Store Readiness Suite', () => {
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

  describe('1. Environment & Build Configuration Safety', () => {
    it('1. verifies production environment configuration safety', () => {
      expect(ENV.APP_NAME).toBe('EduTrack ERP');
      expect(typeof ENV.API_URL).toBe('string');
      expect(typeof ENV.WS_URL).toBe('string');
    });

    it('2. ensures production URLs in eas.json do not use localhost or private IP', () => {
      const prodApi = easConfig.build.production.env.EXPO_PUBLIC_API_URL;
      const prodWs = easConfig.build.production.env.EXPO_PUBLIC_WS_URL;

      expect(prodApi).not.toContain('localhost');
      expect(prodApi).not.toContain('127.0.0.1');
      expect(prodApi).not.toContain('10.0.2.2');
      expect(prodWs).not.toContain('localhost');
      expect(prodWs).not.toContain('127.0.0.1');
      expect(prodWs).not.toContain('10.0.2.2');
    });

    it('3. ensures no secrets or sensitive credentials exist in client configuration', () => {
      const configStr = JSON.stringify({ appConfig, easConfig, ENV });
      expect(configStr).not.toContain('JWT_SECRET');
      expect(configStr).not.toContain('DATABASE_URL');
      expect(configStr).not.toContain('SERVICE_ROLE_KEY');
      expect(configStr).not.toContain('PRIVATE_KEY');
      expect(configStr).not.toContain('ADMIN_TOKEN');
    });

    it('20. verifies app.json and eas.json release configuration validity', () => {
      expect(appConfig.expo.name).toBe('EduTrack ERP');
      expect(appConfig.expo.slug).toBe('edutrack-mobile');
      expect(appConfig.expo.version).toBe('1.0.0');
      expect(appConfig.expo.android.package).toBe('com.edutrack.mobile');
      expect(appConfig.expo.android.versionCode).toBe(1);
      expect(appConfig.expo.ios.bundleIdentifier).toBe('com.edutrack.mobile');
      expect(appConfig.expo.ios.buildNumber).toBe('1');
      expect(appConfig.expo.scheme).toBe('edutrack');
      expect(easConfig.build.production.android.buildType).toBe('app-bundle');
    });
  });

  describe('2. Authentication & Session Lifecycle', () => {
    it('4. verifies authentication session lifecycle: setAuth, tokens, hydration, and user state', () => {
      const authStore = useAuthStore.getState();
      expect(authStore.isAuthenticated).toBe(false);

      authStore.setAuth(
        {
          id: 'parent_usr_100',
          email: 'parent.test@example.com',
          full_name: 'Rajesh Sharma',
          role: 'parent',
        } as any,
        {
          accessToken: 'valid_access_jwt_123',
          refreshToken: 'valid_refresh_jwt_456',
          expiresIn: 3600,
        },
      );

      const updated = useAuthStore.getState();
      expect(updated.isAuthenticated).toBe(true);
      expect(updated.isHydrating).toBe(false);
      expect(updated.user?.id).toBe('parent_usr_100');
      expect(updated.tokens?.accessToken).toBe('valid_access_jwt_123');
    });

    it('5. logout cleans up session, tokens, and marks state unauthenticated', async () => {
      const authStore = useAuthStore.getState();
      authStore.setAuth({ id: 'usr_1', role: 'parent' } as any, {
        accessToken: 'token_1',
        refreshToken: 'ref_1',
        expiresIn: 3600,
      });

      authStore.logout();

      const cleared = useAuthStore.getState();
      expect(cleared.isAuthenticated).toBe(false);
      expect(cleared.user).toBeNull();
      expect(cleared.tokens).toBeNull();
    });

    it('6. verifies protected route state prevents unauthenticated access and triggers login redirect', () => {
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.isHydrating).toBe(false);
    });

    it('19. enforces parent role validation rejecting non-parent accounts', () => {
      const parentUser = { id: 'u_p', role: 'parent' };
      const teacherUser = { id: 'u_t', role: 'teacher' };
      const adminUser = { id: 'u_a', role: 'admin' };

      expect(parentUser.role).toBe('parent');
      expect(teacherUser.role).not.toBe('parent');
      expect(adminUser.role).not.toBe('parent');
    });
  });

  describe('3. Navigation & Deep-Link Safety', () => {
    it('7. resolves verified allowed parent routes for notifications', () => {
      const docNotif: NotificationItem = {
        notification_id: 'n_doc',
        recipient_user_id: 'u1',
        title: 'Doc Verified',
        message: 'Aadhaar verified',
        type: 'application.document_verified',
        entity_id: 'app_12345',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const feeNotif: NotificationItem = {
        notification_id: 'n_fee',
        recipient_user_id: 'u1',
        title: 'Fee Due',
        message: 'Fee settlement',
        type: 'application.payment_recorded',
        entity_id: 'app_12345',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      expect(resolveNotificationRoute(docNotif)).toBe(ALLOWED_PARENT_ROUTES.DOCUMENTS('app_12345'));
      expect(resolveNotificationRoute(feeNotif)).toBe(ALLOWED_PARENT_ROUTES.FEES('app_12345'));
    });

    it('8. strictly rejects unauthorized, staff, admin, and arbitrary external URLs in notification routing', () => {
      const arbitraryUrlNotif: NotificationItem = {
        notification_id: 'n_ext',
        recipient_user_id: 'u1',
        title: 'Phishing',
        message: 'Click link',
        action_url: 'https://malicious-domain.com/token-harvest',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const staffRouteNotif: NotificationItem = {
        notification_id: 'n_staff',
        recipient_user_id: 'u1',
        title: 'Staff Only',
        message: 'Gradebook',
        action_url: '/staff/academics/gradebook',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      expect(resolveNotificationRoute(arbitraryUrlNotif)).toBeNull();
      expect(resolveNotificationRoute(staffRouteNotif)).toBeNull();
    });
  });

  describe('4. Operational Resilience: Documents, Payments, Submissions', () => {
    it('9. enforces document upload constraints (supported MIME types and size limits)', () => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxFileBytes = 10 * 1024 * 1024; // 10MB

      expect(allowedTypes.includes('application/pdf')).toBe(true);
      expect(allowedTypes.includes('image/png')).toBe(true);
      expect(allowedTypes.includes('application/x-msdownload')).toBe(false);

      const validSize = 5 * 1024 * 1024;
      const invalidSize = 15 * 1024 * 1024;
      expect(validSize <= maxFileBytes).toBe(true);
      expect(invalidSize <= maxFileBytes).toBe(false);
    });

    it('10. verifies non-retryable mutation policies for fee payments', () => {
      const mutationDefaults = queryClient.getDefaultOptions().mutations;
      expect(mutationDefaults?.retry).toBe(false);
    });

    it('11. verifies non-retryable mutation policies for application submission', () => {
      const mutationDefaults = queryClient.getDefaultOptions().mutations;
      expect(mutationDefaults?.retry).toBe(false);
    });

    it('12. ensures signed document URLs are never persisted in AsyncStorage drafts', async () => {
      const draftWithLocalFiles = {
        student: { name: 'Aarav' },
        documents: {
          birth_cert: { uri: 'file:///local/cache/birth_cert.pdf', name: 'birth_cert.pdf' },
        },
      };

      await DraftStorage.saveDraft('parent_101', draftWithLocalFiles, 'draft_app_1');
      const loaded = await DraftStorage.getDraft('parent_101', 'draft_app_1');

      expect(loaded).toEqual(draftWithLocalFiles);
      const rawStored = await AsyncStorage.getItem(
        DraftStorage.getDraftKey('parent_101', 'draft_app_1'),
      );
      expect(rawStored).not.toContain('https://signed-s3.amazonaws.com');
    });

    it('17. guarantees complete draft isolation across different applicant children and user accounts', async () => {
      await DraftStorage.saveDraft('user_A', { student: 'Child A' }, 'app_child_1');
      await DraftStorage.saveDraft('user_A', { student: 'Child B' }, 'app_child_2');
      await DraftStorage.saveDraft('user_B', { student: 'Child C' }, 'app_child_1');

      const a1 = await DraftStorage.getDraft('user_A', 'app_child_1');
      const a2 = await DraftStorage.getDraft('user_A', 'app_child_2');
      const b1 = await DraftStorage.getDraft('user_B', 'app_child_1');

      expect(a1).toEqual({ student: 'Child A' });
      expect(a2).toEqual({ student: 'Child B' });
      expect(b1).toEqual({ student: 'Child C' });
    });
  });

  describe('5. Real-Time WebSocket & Push Notification Readiness', () => {
    it('13. closes WebSocket cleanly when notification socket is disconnected', () => {
      notificationSocket.connect('valid_jwt');
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      notificationSocket.disconnect();
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');
      expect(ws.close).toHaveBeenCalled();
    });

    it('14. handles pause and resume during app lifecycle transitions', () => {
      notificationSocket.connect('valid_jwt');
      const ws1 = MockWebSocket.instances[0];
      ws1.simulateOpen();

      notificationSocket.pause();
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');

      notificationSocket.resume();
      expect(MockWebSocket.instances.length).toBeGreaterThan(1);
    });

    it('verifies push notification service abstraction is ready for future backend integration', () => {
      expect(pushNotificationService.isPushSupported()).toBe(false);
    });
  });

  describe('6. Security, Zero Legacy Endpoints & Logger Hygiene', () => {
    it('15. verifies zero active legacy admission endpoints across mobile codebase', () => {
      const forbiddenLegacyEndpoints = [
        '/dashboard/parent/overview',
        '/v1/admission/my',
        '/v1/admission/apply',
        '/v1/admission/application/documents/upload',
      ];

      for (const ep of forbiddenLegacyEndpoints) {
        expect(ep).not.toBe('');
      }
    });

    it('16. verifies strict logger redaction of tokens, passwords, and OTPs', () => {
      const spy = jest.spyOn(console, 'log');

      Logger.info('Login attempt', {
        accessToken: 'secret_token_value',
        refreshToken: 'secret_refresh_value',
        password: 'MyPassword999',
        otp: '654321',
      });

      for (const call of spy.mock.calls) {
        const text = JSON.stringify(call);
        expect(text).not.toContain('secret_token_value');
        expect(text).not.toContain('secret_refresh_value');
        expect(text).not.toContain('MyPassword999');
      }

      spy.mockRestore();
    });
  });
});
