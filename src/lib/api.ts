import axios from 'axios';
import { PORTAL_PROXY_URL, PORTAL_API_KEY, PORTAL_CLIENT_ID } from './proxyConfig';
import { getToken, getTokenPayload } from '@/services/authService';

export const API_TIMEOUT = 30000;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || PORTAL_PROXY_URL,
    headers: {
        apikey: import.meta.env.VITE_API_KEY || PORTAL_API_KEY,
        clientid: PORTAL_CLIENT_ID,
        accept: 'application/json, text/plain, */*',
    },
    
    timeout: API_TIMEOUT,
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            const tokenData = getTokenPayload();
            if (tokenData && tokenData.exp && tokenData.exp * 1000 > Date.now()) {
                config.headers.authorization = `Bearer ${token}`;
            } else {
                localStorage.removeItem('authorizationData');
                window.location.href = '/login';
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authorizationData');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
