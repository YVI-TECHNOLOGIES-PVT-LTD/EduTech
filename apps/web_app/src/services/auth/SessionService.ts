import { supabase } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const SessionService = {
    /**
     * Get the current active Supabase session.
     */
    getSession: async (): Promise<Session | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    /**
     * Force-refresh the current session tokens.
     */
    refreshSession: async (): Promise<Session | null> => {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return session;
    },

    /**
     * Check if the current session is still valid (not expired).
     */
    isSessionValid: async (): Promise<boolean> => {
        const session = await SessionService.getSession();
        if (!session) return false;
        // Supabase expiry is in seconds from epoch
        const expiresAt = session.expires_at ?? 0;
        return Date.now() / 1000 < expiresAt;
    },

    /**
     * Get the remaining session lifetime in seconds.
     */
    getSecondsUntilExpiry: async (): Promise<number> => {
        const session = await SessionService.getSession();
        if (!session) return 0;
        const expiresAt = session.expires_at ?? 0;
        return Math.max(0, expiresAt - Date.now() / 1000);
    },

    /**
     * Subscribe to auth state changes.
     * Returns the unsubscribe function.
     */
    onSessionChange: (callback: (event: string, session: Session | null) => void) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        return () => subscription.unsubscribe();
    },
};
