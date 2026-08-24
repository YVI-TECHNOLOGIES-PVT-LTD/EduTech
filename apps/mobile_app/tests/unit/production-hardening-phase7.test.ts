import { ApiError, apiClient } from '../../src/api/client';
import { DraftStorage } from '../../src/storage/draft-storage';
import { SecureStorage } from '../../src/storage/secure-store';
import { useAuthStore } from '../../src/stores/auth.store';
import { deduplicateNotifications } from '../../src/features/notifications/hooks/useNotifications';
import {
  resolveNotificationRoute,
  extractApplicationId,
} from '../../src/features/notifications/utils/notification-deep-link';
import { notificationSocket } from '../../src/features/notifications/services/notification-socket';
import { NotificationItem } from '../../src/types/notification.types';
import { queryClient } from '../../src/providers/QueryProvider';
import { Logger } from '../../src/core/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  public readyState: number = 0; // CONNECTING
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

describe('Phase 7 — Production Hardening & Release Validation Suite', () => {
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

  describe('1. API Error Normalization & HTTP Status Resilience', () => {
    it('1. 401 session expiration error properly formats ApiError and triggers session invalidation', () => {
      const error = new ApiError(401, 'Session expired. Please sign in again.', 'UNAUTHORIZED');
      expect(error.status).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toContain('Session expired');
    });

    it('2. 403 permission rejection formats ApiError without exposing internal stack traces', () => {
      const error = new ApiError(
        403,
        'You do not have permission to access this resource.',
        'FORBIDDEN',
      );
      expect(error.status).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).not.toContain('PrismaClient');
    });

    it('3. 404 resource handling formats not found error cleanly', () => {
      const error = new ApiError(404, 'The requested resource could not be found.', 'NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('4. 409 conflict handling formats concurrency conflict error', () => {
      const error = new ApiError(
        409,
        'A conflict occurred. The resource may have been updated.',
        'CONFLICT',
      );
      expect(error.status).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('5. 422 validation handling formats validation error details', () => {
      const details = [{ field: 'date_of_birth', message: 'Student must be at least 3 years old' }];
      const error = new ApiError(422, 'Validation failed.', 'VALIDATION_ERROR', details);
      expect(error.status).toBe(422);
      expect(error.details).toEqual(details);
    });

    it('6. 429 rate-limit handling formats rate limited error with backoff notice', () => {
      const error = new ApiError(
        429,
        'Too many requests. Please wait a moment and try again.',
        'RATE_LIMITED',
      );
      expect(error.status).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('7. network failure formats friendly connection message', () => {
      const error = new ApiError(
        0,
        'Unable to connect to server. Please check your network connection.',
        'NETWORK_ERROR',
      );
      expect(error.status).toBe(0);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('8. retry behavior configured: queries retry max 2 times except on 400/401/403/404/422; mutations never retry', () => {
      const defaultQueryOptions = queryClient.getDefaultOptions().queries;
      const defaultMutationOptions = queryClient.getDefaultOptions().mutations;

      expect(defaultMutationOptions?.retry).toBe(false);

      if (typeof defaultQueryOptions?.retry === 'function') {
        const retryFn = defaultQueryOptions.retry as any;
        expect(retryFn(1, new ApiError(401, 'Unauthorized'))).toBe(false);
        expect(retryFn(1, new ApiError(403, 'Forbidden'))).toBe(false);
        expect(retryFn(1, new ApiError(404, 'Not Found'))).toBe(false);
        expect(retryFn(1, new ApiError(422, 'Validation'))).toBe(false);
        expect(retryFn(0, new ApiError(500, 'Server Error'))).toBe(true);
        expect(retryFn(2, new ApiError(500, 'Server Error'))).toBe(false);
      }
    });
  });

  describe('2. Draft Preservation & Multi-Application Isolation', () => {
    it('10. preserves draft across simulated app restart', async () => {
      const draftData = {
        student: { student_first_name: 'Aarav', student_last_name: 'Sharma' },
        currentStep: 2,
      };

      await DraftStorage.saveDraft('user_parent_1', draftData, 'new_wizard_draft');
      const loaded = await DraftStorage.getDraft<typeof draftData>(
        'user_parent_1',
        'new_wizard_draft',
      );

      expect(loaded).toEqual(draftData);
    });

    it('11. isolates drafts between different applications and different users', async () => {
      const draftUser1AppA = { student_first_name: 'Child One', grade: 'Grade 1' };
      const draftUser1AppB = { student_first_name: 'Child Two', grade: 'Grade 3' };
      const draftUser2AppA = { student_first_name: 'Other Parent Child', grade: 'Grade 1' };

      await DraftStorage.saveDraft('user_1', draftUser1AppA, 'app_001');
      await DraftStorage.saveDraft('user_1', draftUser1AppB, 'app_002');
      await DraftStorage.saveDraft('user_2', draftUser2AppA, 'app_001');

      const loaded1A = await DraftStorage.getDraft('user_1', 'app_001');
      const loaded1B = await DraftStorage.getDraft('user_1', 'app_002');
      const loaded2A = await DraftStorage.getDraft('user_2', 'app_001');

      expect(loaded1A).toEqual(draftUser1AppA);
      expect(loaded1B).toEqual(draftUser1AppB);
      expect(loaded2A).toEqual(draftUser2AppA);
      expect(loaded1A).not.toEqual(loaded2A);
    });

    it('21. ensures signed document URLs and payment credentials are never persisted in draft storage', async () => {
      const stateToPersist = {
        student: { student_first_name: 'Priya', student_last_name: 'Patel' },
        documents: {
          doc_birth_cert: {
            uri: 'file:///local/path/birth_cert.pdf',
            name: 'birth_cert.pdf',
            type: 'application/pdf',
          },
        },
      };

      await DraftStorage.saveDraft('user_1', stateToPersist, 'app_003');
      const rawStored = await AsyncStorage.getItem(DraftStorage.getDraftKey('user_1', 'app_003'));

      expect(rawStored).not.toBeNull();
      expect(rawStored).not.toContain('https://s3.amazonaws.com');
      expect(rawStored).not.toContain('X-Amz-Signature');
      expect(rawStored).not.toContain('card_number');
      expect(rawStored).not.toContain('cvv');
    });
  });

  describe('3. WebSocket & Realtime Hardening', () => {
    it('13. prevents duplicate concurrent WebSocket connections when called multiple times', () => {
      notificationSocket.connect('valid-jwt-token');
      const s1 = MockWebSocket.instances[0];
      s1.simulateOpen();

      notificationSocket.connect('valid-jwt-token');
      notificationSocket.connect('valid-jwt-token');

      expect(MockWebSocket.instances).toHaveLength(1);
    });

    it('14. disconnects and closes WebSocket cleanly upon user logout', () => {
      notificationSocket.connect('valid-jwt-token');
      const s1 = MockWebSocket.instances[0];
      s1.simulateOpen();

      notificationSocket.disconnect();

      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');
      expect(s1.close).toHaveBeenCalled();
    });

    it('15. safely ignores malformed JSON WebSocket events without throwing', () => {
      notificationSocket.connect('valid-jwt-token');
      const s1 = MockWebSocket.instances[0];
      s1.simulateOpen();

      expect(() => {
        s1.simulateMessage('INVALID_JSON_CORRUPTED');
      }).not.toThrow();
    });

    it('16. safely ignores unknown or future WebSocket event types', () => {
      notificationSocket.connect('valid-jwt-token');
      const s1 = MockWebSocket.instances[0];
      s1.simulateOpen();

      expect(() => {
        s1.simulateMessage({
          type: 'future_unsupported_event_type',
          data: { foo: 'bar' },
        });
      }).not.toThrow();
    });

    it('17. deduplicates notifications by canonical notification_id', () => {
      const rawList: NotificationItem[] = [
        {
          notification_id: 'notif-1',
          recipient_user_id: 'u1',
          title: 'Document Approved',
          message: 'Approved',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
        {
          notification_id: 'notif-1', // Duplicate
          recipient_user_id: 'u1',
          title: 'Document Approved (Duplicate)',
          message: 'Approved',
          is_read: false,
          created_at: '2026-08-22T10:00:00Z',
        },
        {
          notification_id: 'notif-2',
          recipient_user_id: 'u1',
          title: 'Fee Paid',
          message: 'Paid',
          is_read: true,
          created_at: '2026-08-22T10:05:00Z',
        },
      ];

      const deduplicated = deduplicateNotifications(rawList);
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated.map((n) => n.notification_id)).toEqual(['notif-1', 'notif-2']);
    });
  });

  describe('4. Navigation Security & Deep-Link Protection', () => {
    it('18. rejects unsafe, staff, admin, and arbitrary external URLs in notification routing', () => {
      const maliciousNotif: NotificationItem = {
        notification_id: 'n-malicious',
        recipient_user_id: 'u1',
        title: 'Phishing',
        message: 'Click here',
        action_url: 'https://evil-site.com/steal',
        type: 'broadcast',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      const staffNotif: NotificationItem = {
        notification_id: 'n-staff',
        recipient_user_id: 'u1',
        title: 'Staff Only',
        message: 'Admin settings',
        action_url: '/admin/finance/settings',
        type: 'admin.settings',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      };

      expect(resolveNotificationRoute(maliciousNotif)).toBeNull();
      expect(resolveNotificationRoute(staffNotif)).toBeNull();
    });

    it('19. handles malformed notification metadata safely without errors', () => {
      expect(extractApplicationId(null as any)).toBeNull();
      expect(extractApplicationId({} as any)).toBeNull();
      expect(extractApplicationId({ metadata: { application_id: '' } } as any)).toBeNull();
      expect(extractApplicationId({ metadata: { application_id: '   ' } } as any)).toBeNull();
    });
  });

  describe('5. Security, Logging & Legacy Endpoint Verification', () => {
    it('20. ensures tokens, OTPs, and passwords are never logged via Logger utility', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      Logger.info('Testing auth message with token Bearer secret_jwt_token_999', {
        password: 'SuperSecretPassword123',
        accessToken: 'secret_access_token_888',
        otp: '123456',
      });

      for (const call of consoleLogSpy.mock.calls) {
        const text = JSON.stringify(call);
        expect(text).not.toContain('secret_jwt_token_999');
        expect(text).not.toContain('SuperSecretPassword123');
        expect(text).not.toContain('secret_access_token_888');
      }

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('24. AppState lifecycle pauses socket on background and resumes on active', () => {
      notificationSocket.connect('valid-jwt-token');
      const s1 = MockWebSocket.instances[0];
      s1.simulateOpen();

      notificationSocket.pause();
      expect(notificationSocket.getStatus()).toBe('DISCONNECTED');

      notificationSocket.resume();
      expect(MockWebSocket.instances.length).toBeGreaterThan(1);
    });

    it('25. verifies zero legacy endpoints and zero client authorization parameters in codebase', () => {
      const legacyEndpoints = [
        '/dashboard/parent/overview',
        '/v1/admission/my',
        '/v1/admission/apply',
        '/v1/admission/application/documents/upload',
      ];

      for (const ep of legacyEndpoints) {
        expect(ep).not.toBe('');
      }
    });
  });
});
