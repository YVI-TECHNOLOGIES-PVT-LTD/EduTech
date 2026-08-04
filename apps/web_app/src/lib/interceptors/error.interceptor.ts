import { supabase } from '../supabase';
import { notify } from '../../components/feedback/Notifications';
import { AxiosRequestConfig } from 'axios';

export interface ApiRequestConfig extends AxiosRequestConfig {
    silent?: boolean;
    _retry?: boolean;
}

export const errorResponseInterceptor = async (error: any) => {
    const status = error.response?.status;
    const originalRequest = error.config as ApiRequestConfig;

    // Handle 401 Unauthorized globally
    if (status === 401 && !originalRequest?._retry) {
        (originalRequest as any)._retry = true;
        const isLoginPage = window.location.pathname.includes('/login');

        if (!isLoginPage) {
            console.warn('[API] Session expired. Redirecting to login...');
            await supabase.auth.signOut();
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
