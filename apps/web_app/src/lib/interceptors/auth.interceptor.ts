import { supabase } from '../supabase';

let currentToken: string | null = null;

// Synchronously sync initial session
supabase.auth.getSession().then(({ data }) => {
    if (data.session) currentToken = data.session.access_token;
});

// Sync subsequent session changes
supabase.auth.onAuthStateChange((_event, session) => {
    currentToken = session ? session.access_token : null;
});

export const authRequestInterceptor = async (config: any) => {
    if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
        return config;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            currentToken = session.access_token;
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('[AuthInterceptor] Failed to resolve auth token:', error);
    }
    return config;
};
export default authRequestInterceptor;
