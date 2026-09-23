import axios from 'axios';
import { PortalProxyUrl, PortalApiKey, PortalClientId } from './proxyConfig';
import { getToken, getTokenPayload, redirectToLogin } from '@/services/authService';

export const ApiTimeout = 30000;

const api = axios.create({
	baseURL: PortalProxyUrl,
	headers: {
		apikey: PortalApiKey,
		clientid: PortalClientId,
		accept: 'application/json, text/plain, */*'
	},

	timeout: ApiTimeout
});

api.interceptors.request.use(
	(config) => {
		const token = getToken();
		if (token) {
			const tokenData = getTokenPayload();
			if (tokenData && tokenData.exp && tokenData.exp * 1000 > Date.now()) {
				config.headers.authorization = `Bearer ${token}`;
			} else {
				redirectToLogin();
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
			redirectToLogin();
		}
		return Promise.reject(error);
	}
);

export default api;
