/**
 * EduTrack ERP Mobile V1 — Foundation Unit Test Runner
 * Executes unit test suites for API Client, Storage, Auth Store, and Canonical Services.
 */

import { ApiError, apiClient } from '../src/api/client';
import { SecureStorage } from '../src/storage/secure-store';
import { DraftStorage } from '../src/storage/draft-storage';
import { useAuthStore } from '../src/stores/auth.store';
import {
  authApi,
  metadataApi,
  applicationsApi,
  documentsApi,
  assessmentApi,
  decisionApi,
  feesApi,
  notificationsApi,
} from '../src/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

async function runFoundationTests() {
  console.log('\n============================================================');
  console.log('🧪 RUNNING MOBILE V1 FOUNDATION UNIT TESTS');
  console.log('============================================================\n');

  // 1. ApiError Class Tests
  console.log('--- 1. ApiError Structure & Codes ---');
  const err404 = new ApiError(404, 'Not found', 'NOT_FOUND', { id: 'app_1' });
  assert(err404 instanceof Error, 'ApiError is an instance of Error');
  assert(err404.status === 404, 'ApiError status is 404');
  assert(err404.code === 'NOT_FOUND', 'ApiError code is NOT_FOUND');
  assert((err404.details as any)?.id === 'app_1', 'ApiError details preserved');

  const errNetwork = new ApiError(0, 'Unable to connect', 'NETWORK_ERROR');
  assert(errNetwork.status === 0, 'Network error has status 0');
  assert(errNetwork.code === 'NETWORK_ERROR', 'Network error has NETWORK_ERROR code');

  // 2. ApiClient Interface Tests
  console.log('\n--- 2. ApiClient Methods ---');
  assert(typeof apiClient.get === 'function', 'apiClient.get is defined');
  assert(typeof apiClient.post === 'function', 'apiClient.post is defined');
  assert(typeof apiClient.patch === 'function', 'apiClient.patch is defined');
  assert(typeof apiClient.put === 'function', 'apiClient.put is defined');
  assert(typeof apiClient.delete === 'function', 'apiClient.delete is defined');
  assert(typeof apiClient.upload === 'function', 'apiClient.upload is defined');

  // 3. SecureStorage Tests
  console.log('\n--- 3. Secure Storage & Secret Isolation ---');
  assert(typeof SecureStorage.getAccessToken === 'function', 'SecureStorage.getAccessToken exists');
  assert(typeof SecureStorage.setAccessToken === 'function', 'SecureStorage.setAccessToken exists');
  assert(
    typeof SecureStorage.getRefreshToken === 'function',
    'SecureStorage.getRefreshToken exists',
  );
  assert(
    typeof SecureStorage.setRefreshToken === 'function',
    'SecureStorage.setRefreshToken exists',
  );
  assert(typeof SecureStorage.clearSession === 'function', 'SecureStorage.clearSession exists');

  // 4. DraftStorage (AsyncStorage) Tests
  console.log('\n--- 4. DraftStorage Key Isolation ---');
  const userKey = DraftStorage.getDraftKey('parent_1', 'app_100');
  assert(
    userKey === 'edutrack_app_draft_parent_1_app_100',
    'Draft key generated with prefix and appId',
  );

  const newDraftKey = DraftStorage.getDraftKey('parent_1');
  assert(
    newDraftKey === 'edutrack_app_draft_parent_1_new',
    'New draft key generated with _new suffix',
  );

  // 5. AuthStore State & Hydration Lifecycle Tests
  console.log('\n--- 5. AuthStore State & Lifecycle ---');
  useAuthStore.getState().logout();
  const initial = useAuthStore.getState();
  assert(initial.isAuthenticated === false, 'AuthStore initialized as unauthenticated');
  assert(initial.user === null, 'AuthStore user is null initially');

  useAuthStore.getState().setAuth(
    {
      id: 'usr_par_1',
      email: 'parent@test.com',
      full_name: 'Sarah Connor',
      first_name: 'Sarah',
      last_name: 'Connor',
      phone: '+919876543210',
      roles: ['PARENT'],
      permissions: ['admission.view'],
    },
    {
      accessToken: 'jwt_mock_token_123',
      refreshToken: 'jwt_mock_refresh_456',
      expiresIn: 3600,
    },
  );

  const authState = useAuthStore.getState();
  assert(authState.isAuthenticated === true, 'AuthStore transitions to authenticated');
  assert(authState.isHydrating === false, 'AuthStore isHydrating becomes false after setAuth');
  assert(
    authState.user?.full_name === 'Sarah Connor',
    'User full_name is correctly saved in store',
  );
  assert(
    authState.tokens?.accessToken === 'jwt_mock_token_123',
    'Access token is correctly saved in store',
  );

  useAuthStore.getState().updateUser({ full_name: 'Sarah C. Connor' });
  assert(
    useAuthStore.getState().user?.full_name === 'Sarah C. Connor',
    'User profile update works',
  );

  useAuthStore.getState().logout();
  const loggedOut = useAuthStore.getState();
  assert(
    loggedOut.isAuthenticated === false,
    'AuthStore transitions to unauthenticated upon logout',
  );
  assert(loggedOut.user === null, 'AuthStore clears user upon logout');
  assert(loggedOut.tokens === null, 'AuthStore clears tokens upon logout');

  // 6. Canonical API Services Structure Tests
  console.log('\n--- 6. Canonical API Services Verification ---');
  assert(typeof authApi.login === 'function', 'authApi.login is defined');
  assert(typeof authApi.registerParent === 'function', 'authApi.registerParent is defined');
  assert(typeof authApi.verifyOtp === 'function', 'authApi.verifyOtp is defined');
  assert(typeof authApi.logout === 'function', 'authApi.logout is defined');

  assert(
    typeof metadataApi.getAdmissionConfig === 'function',
    'metadataApi.getAdmissionConfig is defined',
  );
  assert(
    typeof metadataApi.getAcademicYears === 'function',
    'metadataApi.getAcademicYears is defined',
  );
  assert(typeof metadataApi.getClasses === 'function', 'metadataApi.getClasses is defined');
  assert(
    typeof metadataApi.getDocumentTypes === 'function',
    'metadataApi.getDocumentTypes is defined',
  );

  assert(typeof applicationsApi.listMine === 'function', 'applicationsApi.listMine is defined');
  assert(typeof applicationsApi.getById === 'function', 'applicationsApi.getById is defined');
  assert(typeof applicationsApi.create === 'function', 'applicationsApi.create is defined');
  assert(
    typeof applicationsApi.updateStatus === 'function',
    'applicationsApi.updateStatus is defined',
  );

  assert(typeof documentsApi.upload === 'function', 'documentsApi.upload is defined');
  assert(typeof documentsApi.getSignedUrl === 'function', 'documentsApi.getSignedUrl is defined');

  assert(
    typeof assessmentApi.getByApplicationId === 'function',
    'assessmentApi.getByApplicationId is defined',
  );

  assert(
    typeof decisionApi.getByApplicationId === 'function',
    'decisionApi.getByApplicationId is defined',
  );

  assert(typeof feesApi.getFeeSummary === 'function', 'feesApi.getFeeSummary is defined');
  assert(typeof feesApi.recordPayment === 'function', 'feesApi.recordPayment is defined');
  assert(typeof feesApi.getReceipt === 'function', 'feesApi.getReceipt is defined');

  assert(typeof notificationsApi.list === 'function', 'notificationsApi.list is defined');
  assert(
    typeof notificationsApi.getUnreadCount === 'function',
    'notificationsApi.getUnreadCount is defined',
  );
  assert(typeof notificationsApi.markRead === 'function', 'notificationsApi.markRead is defined');
  assert(
    typeof notificationsApi.markAllRead === 'function',
    'notificationsApi.markAllRead is defined',
  );

  console.log('\n============================================================');
  console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runFoundationTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
