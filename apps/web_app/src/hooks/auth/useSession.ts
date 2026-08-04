import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SessionService } from '../../services/auth/SessionService';

interface SessionState {
    session: Session | null;
    isValid: boolean;
    isExpired: boolean;
    secondsUntilExpiry: number;
    loading: boolean;
}

/**
 * Subscribes to Supabase session state changes and exposes session metadata.
 * Use this hook for session-aware UI (e.g. session expiry warnings).
 */
export const useSession = (): SessionState => {
    const [session, setSession] = useState<Session | null>(null);
    const [secondsUntilExpiry, setSecondsUntilExpiry] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session load
        SessionService.getSession().then(s => {
            setSession(s);
            setLoading(false);
        });

        // Subscribe to changes
        const unsubscribe = SessionService.onSessionChange((_event, newSession) => {
            setSession(newSession);
        });

        // Poll expiry countdown every 30 seconds
        const interval = setInterval(async () => {
            const secs = await SessionService.getSecondsUntilExpiry();
            setSecondsUntilExpiry(secs);
        }, 30_000);

        // Initial expiry read
        SessionService.getSecondsUntilExpiry().then(setSecondsUntilExpiry);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return {
        session,
        isValid: !!session && secondsUntilExpiry > 0,
        isExpired: !!session && secondsUntilExpiry <= 0,
        secondsUntilExpiry,
        loading,
    };
};
