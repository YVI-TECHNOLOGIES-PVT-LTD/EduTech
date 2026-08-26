import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api-client';
import { EnrichedUser } from '../types/auth';
import { useAppDispatch, useAppSelector } from '../app/store';
import {
  setUser,
  setCredentials,
  logout as logoutAction,
  setInitializing,
  setSystemMode,
} from '../shared/store/authSlice';
import { setPermissions, clearPermissions } from '../shared/store/permissionSlice';
import { setActiveTenant, setSchoolId } from '../shared/store/tenantSlice';
import { selectHasPermission, selectHasRole } from '../shared/auth/permissionSelectors';
import {
  resetAuthenticatedClientState,
  getCurrentSessionGeneration,
  getNextSessionGeneration,
} from '../lib/auth/sessionReset';

export type AuthBoundaryState = 'initializing' | 'stable' | 'switching' | 'signed_out';

export interface AuthContextType {
  session: Session | null;
  user: EnrichedUser | null;
  accessToken: string | null;
  loading: boolean;
  boundaryState: AuthBoundaryState;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshProfile: () => Promise<void>;
  systemMode: 'UAT' | 'PRODUCTION';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  // Supabase session remains in local React state inside AuthProvider (sole credential authority)
  const [session, setSession] = useState<Session | null>(null);
  const [boundaryState, setBoundaryState] = useState<AuthBoundaryState>('initializing');

  // Redux Application Auth State
  const user = useAppSelector((state) => state.auth.user) as EnrichedUser | null;
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isInitializing = useAppSelector((state) => state.auth.isInitializing);
  const systemMode = useAppSelector((state) => state.auth.systemMode);
  const reduxIsAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const userPermissions = useAppSelector((state) => state.permission.permissions);
  const userRoles = useAppSelector((state) => state.permission.roles);

  // Profile fetch tracker and auth boundary tracker (userId:tenantId:role)
  const profileFetchTracker = useRef<string | null>(null);
  const currentAuthBoundaryRef = useRef<string | null>(null);
  const initialSessionResolvedRef = useRef<boolean>(false);

  /**
   * Fetches enriched user profile from backend and dispatches to Redux auth & tenant slices.
   * Employs generation checking to discard responses if session changed while in flight.
   */
  const fetchUserProfile = useCallback(
    async (token?: string) => {
      const requestGeneration = getCurrentSessionGeneration();
      try {
        const activeToken = token || (await supabase.auth.getSession()).data.session?.access_token;
        if (!activeToken) {
          if (requestGeneration === getCurrentSessionGeneration()) {
            dispatch(setInitializing(false));
            setBoundaryState('signed_out');
          }
          return;
        }

        const res = await apiClient.get('/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Drop response if auth state changed while request was in flight
        if (requestGeneration !== getCurrentSessionGeneration()) {
          return;
        }

        if (res.data?.user) {
          const enrichedUser: EnrichedUser = res.data.user;
          const tenantId = enrichedUser.school_id || '';
          const primaryRole = enrichedUser.roles?.[0] || (enrichedUser as any)?.role || '';
          const newBoundary = `${enrichedUser.id}:${tenantId}:${primaryRole}`;

          // Check if boundary changed for an already-resolved session
          if (
            initialSessionResolvedRef.current &&
            currentAuthBoundaryRef.current &&
            currentAuthBoundaryRef.current !== newBoundary
          ) {
            const [prevUserId, prevTenantId, prevRole] = currentAuthBoundaryRef.current.split(':');
            if (prevUserId !== enrichedUser.id) {
              await resetAuthenticatedClientState('user_changed');
            } else if (prevTenantId !== tenantId) {
              await resetAuthenticatedClientState('tenant_changed');
            } else if (prevRole !== primaryRole) {
              await resetAuthenticatedClientState('role_changed');
            }
          }

          currentAuthBoundaryRef.current = newBoundary;
          profileFetchTracker.current = enrichedUser.id;
          initialSessionResolvedRef.current = true;

          // Dispatch identity profile to authSlice
          dispatch(setUser(enrichedUser));
          // Dispatch roles and permissions to permissionSlice
          dispatch(
            setPermissions({
              roles: enrichedUser.roles || [],
              permissions: enrichedUser.permissions || [],
            }),
          );
          // Dispatch tenant/school context to tenantSlice
          if (enrichedUser.school_id) {
            dispatch(setActiveTenant({ id: enrichedUser.school_id }));
            dispatch(setSchoolId(enrichedUser.school_id));
          }

          setBoundaryState('stable');
        } else {
          dispatch(setUser(null));
          dispatch(clearPermissions());
          setBoundaryState('signed_out');
        }
      } catch (error: any) {
        if (requestGeneration === getCurrentSessionGeneration()) {
          console.error('[Auth] Profile fetch failed:', error.response?.status || error.message);
          dispatch(setUser(null));
          dispatch(clearPermissions());
          setBoundaryState('signed_out');
        }
      } finally {
        if (requestGeneration === getCurrentSessionGeneration()) {
          dispatch(setInitializing(false));
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      dispatch(setInitializing(true));
      setBoundaryState('initializing');

      // Fetch System Info (Public)
      try {
        const sysRes = await apiClient.get('/system/info');
        if (isMounted && sysRes.data?.mode) {
          dispatch(setSystemMode(sysRes.data.mode));
        }
      } catch (e) {
        console.error('[Auth] System Info fetch failed');
      }

      // Initial Supabase Session Sync or Native JWT restoration
      const storedToken = localStorage.getItem('edutrack_access_token');
      const {
        data: { session: initSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (initSession?.access_token) {
        setSession(initSession);
        profileFetchTracker.current = initSession.user.id;
        await new Promise((r) => setTimeout(r, 50));
        await fetchUserProfile(initSession.access_token);
      } else if (storedToken) {
        await fetchUserProfile(storedToken);
      } else {
        initialSessionResolvedRef.current = true;
        setBoundaryState('signed_out');
        dispatch(setInitializing(false));
      }
    };

    initialize();

    // Browser bfcache protection (pageshow event)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[Auth] Page restored from bfcache, revalidating session');
        }
        void fetchUserProfile();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    // Supabase Auth Lifecycle Subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      console.debug(`[Auth] Event: ${event}`);

      if (currentSession) {
        const isNewUser =
          initialSessionResolvedRef.current &&
          currentSession.user.id !== profileFetchTracker.current;

        if (isNewUser) {
          setBoundaryState('switching');
          // Hard client reset BEFORE allowing new user data to load/render
          await resetAuthenticatedClientState('user_switch_detected');
          dispatch(setInitializing(true));
        }

        setSession(currentSession);
        profileFetchTracker.current = currentSession.user.id;

        if (isNewUser || event === 'SIGNED_IN' || !initialSessionResolvedRef.current) {
          await fetchUserProfile(currentSession.access_token);
        }
      } else {
        // If transitioning to signed out from an authenticated session
        if (profileFetchTracker.current) {
          await resetAuthenticatedClientState('session_expired_or_signed_out');
          profileFetchTracker.current = null;
          currentAuthBoundaryRef.current = null;
        }
        setSession(null);
        setBoundaryState('signed_out');
        dispatch(setInitializing(false));
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('pageshow', handlePageShow);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, dispatch]);

  /**
   * Canonical single entry point for user logout across the entire application.
   */
  const signOut = async () => {
    dispatch(setInitializing(true));
    setBoundaryState('switching');
    try {
      profileFetchTracker.current = null;
      currentAuthBoundaryRef.current = null;
      setSession(null);
      await resetAuthenticatedClientState('user_explicit_sign_out');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Error during signOut:', err);
    } finally {
      setBoundaryState('signed_out');
      dispatch(setInitializing(false));
    }
  };

  const hasPermission = useCallback(
    (code: string): boolean => {
      const rawRoles =
        userRoles && userRoles.length > 0
          ? userRoles
          : user?.roles || ((user as any)?.role ? [(user as any).role] : []);
      const normalized = rawRoles.map((r: string) =>
        String(r)
          .toUpperCase()
          .replace(/[\s_-]+/g, '_'),
      );
      if (
        normalized.includes('ADMIN') ||
        normalized.includes('SUPERADMIN') ||
        normalized.includes('SUPER_ADMIN') ||
        normalized.includes('ORG_ADMIN') ||
        normalized.includes('EXAM_CELL_ADMIN')
      )
        return true;
      if (
        normalized.includes('FRONT_OFFICE') ||
        normalized.includes('FO') ||
        normalized.includes('RECEPTIONIST') ||
        normalized.includes('FRONT_OFFICE_STAFF') ||
        normalized.includes('STAFF') ||
        normalized.includes('FACULTY') ||
        normalized.includes('ADMISSION_OFFICER') ||
        normalized.includes('ADMISSIONS_OFFICER') ||
        normalized.includes('COUNSELLOR') ||
        normalized.includes('COUNSELOR') ||
        normalized.includes('HOI') ||
        normalized.includes('HEAD_OF_INSTITUTE') ||
        normalized.includes('PRINCIPAL')
      ) {
        return true;
      }
      if (normalized.includes('PARENT') || normalized.includes('GUARDIAN')) {
        const parentPermissions = [
          'admission.view_own',
          'admission.create',
          'admission.application.view_own',
          'admission.application.create',
          'admission.application.view',
          'admission.read',
          'student.dashboard.view',
          'parent.dashboard.view',
        ];
        if (parentPermissions.includes(code)) return true;
      }
      const rawPermissions =
        userPermissions && userPermissions.length > 0 ? userPermissions : user?.permissions || [];
      return rawPermissions.includes(code) ?? false;
    },
    [userPermissions, userRoles, user],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      const searchNorm = role.toUpperCase().replace(/[\s_-]+/g, '_');
      const rawRoles =
        userRoles && userRoles.length > 0
          ? userRoles
          : user?.roles || ((user as any)?.role ? [(user as any).role] : []);
      return (
        rawRoles.some(
          (r: string) =>
            String(r)
              .toUpperCase()
              .replace(/[\s_-]+/g, '_') === searchNorm,
        ) ?? false
      );
    },
    [userRoles, user],
  );

  const value: AuthContextType = {
    session,
    user,
    accessToken,
    loading: isInitializing,
    boundaryState,
    isAuthenticated: Boolean((session || accessToken) && user && reduxIsAuthenticated),
    signOut,
    hasPermission,
    hasRole,
    systemMode,
    refreshProfile: () => fetchUserProfile(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
