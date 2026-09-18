import axios from 'axios';
import { PORTAL_PROXY_URL } from './proxyConfig';

export const API_TIMEOUT = 30000;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || PORTAL_PROXY_URL,
    headers: {
        apikey: import.meta.env.VITE_API_KEY || 'neucqpscrbf0zt2mqo6vmw69ymoh43irb2rtxbs0ehit2kzvl2auxafjbvw==',
        clientid: 'neucq',
        accept: 'application/json, text/plain, */*',
    },
    
    timeout: API_TIMEOUT,
});

api.interceptors.request.use(
    (config) => {
        let token: string | null = null;
        const raw = localStorage.getItem('authorizationData');
        if (raw) {
            try {
                token = JSON.parse(raw).Token ?? null;
            } catch {
                token = null;
            }
        }
        if (token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                if (tokenData.exp * 1000 > Date.now()) {
                    config.headers.authorization = `Bearer ${token}`;
                } else {
                    localStorage.removeItem('authorizationData');
                    window.location.href = '/login';
                }
            } catch {
                localStorage.removeItem('authorizationData');
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
