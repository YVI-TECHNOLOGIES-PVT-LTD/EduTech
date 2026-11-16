import { supabase } from '../supabase';
import { notify } from '../../components/feedback/Notifications';
import { AxiosRequestConfig } from 'axios';

import { resetAuthenticatedClientState } from '../auth/sessionReset';

export interface ApiRequestConfig extends AxiosRequestConfig {
    silent?: boolean;
    _retry?: boolean;
}

export const errorResponseInterceptor = async (error: any) => {
    const status = error.response?.status;
    const originalRequest = error.config as ApiRequestConfig;

    // Handle 401 Unauthorized globally
    if (status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        const isLoginPage = window.location.pathname.includes('/login');

        if (!isLoginPage) {
            console.warn('[API] Session expired. Executing client reset and redirecting to login...');
            await resetAuthenticatedClientState('api_401_session_expired');
            try {
                await supabase.auth.signOut();
            } catch {}
            window.location.href = '/login?reason=expired';
        }
    }

    // Handle 403 Forbidden (RBAC violation)
    if (status === 403) {
        console.error('[API] Forbidden: Insufficient permissions');
        if (!originalRequest?.silent) {
            notify.error('Access Denied: Insufficient Permissions');
        }
    }

    // Handle 500 Internal Server Error
    if (status >= 500) {
        console.error('[API] Internal Server Exception');
        if (!originalRequest?.silent) {
            notify.error('Server error. Please try again later.');
        }
    }

    return Promise.reject(error);
};
export default errorResponseInterceptor;
