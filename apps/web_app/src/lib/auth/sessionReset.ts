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
 * Strict allowlist of auth-scoped localStorage/sessionStorage keys that
 * must be cleared on logout or user/tenant transition.
 */
export const AUTH_SCOPED_STORAGE_KEYS = [
  API_CONFIG.tokenKeys.accessToken, // 'edutrack_access_token'
  API_CONFIG.tokenKeys.refreshToken, // 'edutrack_refresh_token'
  API_CONFIG.tokenKeys.userProfile, // 'edutrack_user_profile'
  API_CONFIG.tokenKeys.tenantId, // 'edutrack_tenant_id'
  'erp-profile',
  'erp-dashboard',
  'edutrack.admission.active_app_id',
  'edutrack_chatbot_session_id',
] as const;

/**
 * Storage key prefixes that belong strictly to individual authenticated users
 * (e.g. namespaced active application IDs).
 */
export const AUTH_SCOPED_PREFIXES = [
  'edutrack.admission.active_app_id.',
  'edutrack.parent.',
  'edutrack.user.',
] as const;

/**
 * Global non-sensitive settings allowlist (MUST BE PRESERVED across logouts):
 * - erp-theme
 * - erp-density
 * - erp-font-size
 * - erp-sidebar-collapsed
 * - i18nextLng
 */

let isResetting = false;

/**
 * Central canonical function to purge all client-side authentication,
 * parent, active application, query cache, and store state.
 *
 * Implements strict idempotency so it can be called safely from AuthContext
 * without running duplicate destructive cycles.
 */
export async function resetAuthenticatedClientState(reason: string = 'auth_transition'): Promise<void> {
  if (isResetting) {
    return;
  }
  isResetting = true;

  try {
    // 1. Advance generation counter to invalidate all in-flight requests
    getNextSessionGeneration();

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[AuthReset] Executing centralized client reset (reason: ${reason}, generation: ${authSessionGeneration})`);
    }

    // 2. Cancel and purge TanStack React Query cache
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch (qErr) {
      console.error('[AuthReset] Error clearing TanStack Query cache:', qErr);
    }

    // 3. Reset all Redux RTK Query API slice caches
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
    } catch (zErr) {
      console.error('[AuthReset] Error resetting Zustand stores:', zErr);
    }

    // 6. Purge auth-scoped localStorage keys
    try {
      for (const key of AUTH_SCOPED_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }

      // Remove keys matching auth prefixes
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && AUTH_SCOPED_PREFIXES.some((prefix) => k.startsWith(prefix))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (lsErr) {
      console.error('[AuthReset] Error cleaning localStorage:', lsErr);
    }

    // 7. Purge auth-scoped sessionStorage keys
    try {
      sessionStorage.removeItem('edutrack.admission.active_app_id');
      sessionStorage.removeItem('edutrack_chatbot_session_id');

      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && AUTH_SCOPED_PREFIXES.some((prefix) => k.startsWith(prefix))) {
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
