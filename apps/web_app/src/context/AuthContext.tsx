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

export interface AuthContextType {
  session: Session | null;
  user: EnrichedUser | null;
  accessToken: string | null;
  loading: boolean;
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

  // Redux Application Auth State
  const user = useAppSelector((state) => state.auth.user) as EnrichedUser | null;
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isInitializing = useAppSelector((state) => state.auth.isInitializing);
  const systemMode = useAppSelector((state) => state.auth.systemMode);
  const reduxIsAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const userPermissions = useAppSelector((state) => state.permission.permissions);
  const userRoles = useAppSelector((state) => state.permission.roles);

  // Profile fetch tracker to avoid duplicate calls
  const profileFetchTracker = useRef<string | null>(null);

  /**
   * Fetches enriched user profile from backend and dispatches to Redux auth & tenant slices.
   */
  const fetchUserProfile = useCallback(
    async (token?: string) => {
      try {
        const activeToken = token || (await supabase.auth.getSession()).data.session?.access_token;
        if (!activeToken) {
          dispatch(setInitializing(false));
          return;
        }

        const res = await apiClient.get('/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data?.user) {
          const enrichedUser: EnrichedUser = res.data.user;
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
        } else {
          dispatch(setUser(null));
          dispatch(clearPermissions());
        }
      } catch (error: any) {
        console.error('[Auth] Profile fetch failed:', error.response?.status || error.message);
        dispatch(setUser(null));
        dispatch(clearPermissions());
      } finally {
        dispatch(setInitializing(false));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      dispatch(setInitializing(true));

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
        await new Promise((r) => setTimeout(r, 100));
        await fetchUserProfile(initSession.access_token);
      } else if (storedToken) {
        await fetchUserProfile(storedToken);
      } else {
        dispatch(setInitializing(false));
      }
    };

    initialize();

    // Supabase Auth Lifecycle Subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      console.debug(`[Auth] Event: ${event}`);
      setSession(currentSession);

      if (currentSession) {
        const isNewUser = currentSession.user.id !== profileFetchTracker.current;

        if (isNewUser || event === 'SIGNED_IN') {
          profileFetchTracker.current = currentSession.user.id;
          if (isNewUser) {
            dispatch(setInitializing(true));
          }
          await fetchUserProfile(currentSession.access_token);
        }
      } else {
        // Do NOT wipe Native JWT Redux credentials on Supabase event
        dispatch(setInitializing(false));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, dispatch]);

  const signOut = async () => {
    dispatch(setInitializing(true));
    try {
      await supabase.auth.signOut();
    } finally {
      profileFetchTracker.current = null;
      setSession(null);
      dispatch(logoutAction());
      dispatch(clearPermissions());
      dispatch(setInitializing(false));
    }
  };

  const hasPermission = useCallback(
    (code: string): boolean => {
      const normalized = userRoles?.map((r) => r.toUpperCase().replace(/[\s_-]+/g, '_')) || [];
      if (
        normalized.includes('ADMIN') ||
        normalized.includes('SUPERADMIN') ||
        normalized.includes('EXAM_CELL_ADMIN')
      )
        return true;
      if (
        normalized.includes('FRONT_OFFICE') ||
        normalized.includes('FO') ||
        normalized.includes('STAFF') ||
        normalized.includes('ADMISSION_OFFICER') ||
        normalized.includes('COUNSELLOR')
      ) {
        return true;
      }
      if (normalized.includes('PARENT')) {
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
      return userPermissions?.includes(code) ?? false;
    },
    [userPermissions, userRoles],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      const searchNorm = role.toUpperCase().replace(/[\s_-]+/g, '_');
      return (
        userRoles?.some((r) => r.toUpperCase().replace(/[\s_-]+/g, '_') === searchNorm) ?? false
      );
    },
    [userRoles],
  );

  const value: AuthContextType = {
    session,
    user,
    accessToken,
    loading: isInitializing,
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
