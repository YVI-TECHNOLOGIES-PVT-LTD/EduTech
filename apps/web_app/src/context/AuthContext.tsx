import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api-client';
import { EnrichedUser } from '../types/auth';

interface AuthContextType {
    session: Session | null;
    user: EnrichedUser | null;
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
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<EnrichedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [systemMode, setSystemMode] = useState<'UAT' | 'PRODUCTION'>('UAT');

    // Using Ref to track the user ID we are currently "loading" to prevent redundant fetches
    const profileFetchTracker = useRef<string | null>(null);

    /**
     * Fetches the enriched user profile from the backend.
     */
    const fetchUserProfile = useCallback(async (token?: string) => {
        try {
            // Priority: Explicit token > Current Session Token
            const activeToken = token || (await supabase.auth.getSession()).data.session?.access_token;
            if (!activeToken) {
                setLoading(false);
                return;
            }

            const res = await apiClient.get('/me', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.data?.user) {
                setUser(res.data.user);
            }
        } catch (error: any) {
            console.error("[Auth] Profile fetch failed:", error.response?.status || error.message);
            // If we have a session but profile fetch fails, it might be a temporary DB issue or a missing record.
            // We clear user to ensure ProtectedRoutes trigger correctly.
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        // 1. Initial State Sync
        const initialize = async () => {
            // Fetch System Mode (Public)
            try {
                const sysRes = await apiClient.get('/system/info');
                if (isMounted) setSystemMode(sysRes.data.mode);
            } catch (e) {
                console.error("[Auth] System Info fetch failed");
            }

            const { data: { session: initSession } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (initSession?.access_token) {
                setSession(initSession);
                profileFetchTracker.current = initSession.user.id;
                // Add short delay to ensure token is ready in interceptor
                await new Promise(r => setTimeout(r, 100));
                await fetchUserProfile(initSession.access_token);
            } else {
                setLoading(false);
            }
        };

        initialize();

        // 2. Lifecycle Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!isMounted) return;

            console.debug(`[Auth] Event: ${event}`);
            setSession(currentSession);

            if (currentSession) {
                const isNewUser = currentSession.user.id !== profileFetchTracker.current;

                // Fetch if user changed or if explicit login event occurred
                if (isNewUser || event === 'SIGNED_IN') {
                    profileFetchTracker.current = currentSession.user.id;

                    // FIXED: Only block UI if it is a completely new user session.
                    // If we are just re-validating the same user, do it in background.
                    if (isNewUser) {
                        setLoading(true);
                    }

                    await fetchUserProfile(currentSession.access_token);
                }
            } else {
                // Cleanup on Logout
                profileFetchTracker.current = null;
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserProfile]);

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
        } finally {
            setUser(null);
            setSession(null);
            profileFetchTracker.current = null;
            setLoading(false);
        }
    };

    const hasPermission = (code: string) => {
        if (!user) return false;
        // Super Admin bypasses all permission checks
        if (user.roles?.some(r => r === 'SUPERADMIN')) return true;
        return user.permissions?.includes(code) || false;
    };

    const hasRole = (role: string) => {
        return user?.roles?.some(r => r.toUpperCase() === role.toUpperCase()) || false;
    };

    const value: AuthContextType = {
        session,
        user,
        loading,
        isAuthenticated: !!session && !!user,
        signOut,
        hasPermission,
        hasRole,
        systemMode,
        refreshProfile: () => fetchUserProfile()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
