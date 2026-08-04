import axios from 'axios';
import { authRequestInterceptor } from './interceptors/auth.interceptor';
import { errorResponseInterceptor } from './interceptors/error.interceptor';

const getBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL;
    if (url) return url;

    if (import.meta.env.PROD) {
        return 'https://appsms-076a.onrender.com/api';
    }

    return 'http://127.0.0.1:3000/api';
};

export const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Configure Request & Response Interceptors
apiClient.interceptors.request.use(authRequestInterceptor, (error) => Promise.reject(error));
apiClient.interceptors.response.use((response) => response, errorResponseInterceptor);
export default apiClient;
