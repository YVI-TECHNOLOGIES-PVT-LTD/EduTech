import { queryClient } from '@/lib/queryClient';
import { store } from '@/app/store';
import { apiSlice } from '@/app/store/apiSlice';
import { logout as logoutAction } from '@/shared/store/authSlice';
import { clearPermissions } from '@/shared/store/permissionSlice';
import { clearTenant } from '@/shared/store/tenantSlice';
import { clearUnreadCount } from '@/shared/store/notificationSlice';
import { useProfileStore } from '@/store/profile.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { API_CONFIG } from '@/config/api';

/**
 * Monotonically increasing session generation counter.
 * Any in-flight asynchronous operations initiated under a previous generation
 * will check this counter and drop stale responses rather than committing state.
 */
let authSessionGeneration = 0;

export function getNextSessionGeneration(): number {
  authSessionGeneration += 1;
  return authSessionGeneration;
}

export function getCurrentSessionGeneration(): number {
  return authSessionGeneration;
}

/**
 * Storage Classification Matrix:
 *
 * 1. GLOBAL (Preserved across all logouts & user transitions):
 *    - 'erp-theme'
 *    - 'erp-density'
 *    - 'erp-font-size'
 *    - 'erp-sidebar-collapsed'
 *    - 'i18nextLng'
 *
 * 2. USER-SCOPED (Preserved across logout, isolated by userId prefix):
 *    - 'edutrack.user.<userId>.*'
 *
 * 3. SESSION-SCOPED (Cleared on logout / user switch / tenant switch):
 *    - Access tokens, refresh tokens, profiles, active IDs, temporary exam sessions,
 *      cached API states, and dashboard widgets.
 */

export const SESSION_SCOPED_STORAGE_KEYS = [
  API_CONFIG.tokenKeys.accessToken, // 'edutrack_access_token'
  API_CONFIG.tokenKeys.refreshToken, // 'edutrack_refresh_token'
  API_CONFIG.tokenKeys.userProfile, // 'edutrack_user_profile'
  API_CONFIG.tokenKeys.tenantId, // 'edutrack_tenant_id'
  'erp-profile',
  'erp-dashboard',
  'edutrack.admission.active_app_id',
  'edutrack_chatbot_session_id',
  'admission_exam_token',
  'admission_exam_session_id',
  'admission_exam_attempt_id',
  'admission_quick_note',
  'admission_tasks',
  'recent_searches',
  'bookmarks',
] as const;

export const SESSION_SCOPED_PREFIXES = [
  'edutrack.admission.active_app_id.',
  'edutrack.admission.',
  'edutrack.frontoffice.',
  'edutrack.counselling.',
  'edutrack.session.',
  'edutrack.grid_state.',
  'erp-dashboard-widgets-',
] as const;

let isResetting = false;

/**
 * Canonical centralized reset function to purge all client-side authentication,
 * active records, query caches, and store state across all personas.
 *
 * Idempotent: safe to invoke from AuthContext lifecycle handlers without recursion.
 */
export async function resetAuthenticatedClientState(
  reason: string = 'auth_transition',
): Promise<void> {
  if (isResetting) {
    return;
  }
  isResetting = true;

  try {
    // 1. Advance generation counter to invalidate all in-flight async requests
    getNextSessionGeneration();

    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `[AuthReset] Executing centralized client reset (reason: ${reason}, generation: ${authSessionGeneration})`,
      );
    }

    // 2. Cancel and purge TanStack React Query cache globally
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch (qErr) {
      console.error('[AuthReset] Error clearing TanStack Query cache:', qErr);
    }

    // 3. Reset all Redux RTK Query API slice caches (covers all injected endpoints)
    try {
      store.dispatch(apiSlice.util.resetApiState());
    } catch (rErr) {
      console.error('[AuthReset] Error resetting RTK Query API state:', rErr);
    }

    // 4. Reset Redux application slices
    try {
      store.dispatch(logoutAction());
      store.dispatch(clearPermissions());
      store.dispatch(clearTenant());
      store.dispatch(clearUnreadCount());
    } catch (sErr) {
      console.error('[AuthReset] Error resetting Redux slices:', sErr);
    }

    // 5. Reset Zustand stores
    try {
      useProfileStore.setState({
        profileData: null,
        isEditing: false,
        isSaving: false,
        hasUnsavedChanges: false,
      });
      useDashboardStore.setState({
        activeRole: null,
        selectedAcademicYearId: null,
        selectedSchoolId: null,
        dashboardMetrics: {},
        lastRefreshedAt: null,
      });
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });
      useAppStore.setState({
        schoolId: '',
        academicYearId: '',
        notificationCount: 0,
      });
    } catch (zErr) {
      console.error('[AuthReset] Error resetting Zustand stores:', zErr);
    }

    // 6. Purge session-scoped localStorage keys (preserving global UI preferences & user-scoped items)
    try {
      for (const key of SESSION_SCOPED_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && SESSION_SCOPED_PREFIXES.some((prefix) => k.startsWith(prefix))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (lsErr) {
      console.error('[AuthReset] Error cleaning localStorage:', lsErr);
    }

    // 7. Purge session-scoped sessionStorage keys
    try {
      sessionStorage.removeItem('edutrack.admission.active_app_id');
      sessionStorage.removeItem('edutrack_chatbot_session_id');

      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && SESSION_SCOPED_PREFIXES.some((prefix) => k.startsWith(prefix))) {
          sessionKeysToRemove.push(k);
        }
      }
      for (const k of sessionKeysToRemove) {
        sessionStorage.removeItem(k);
      }
    } catch (ssErr) {
      console.error('[AuthReset] Error cleaning sessionStorage:', ssErr);
    }
  } finally {
    isResetting = false;
  }
}
