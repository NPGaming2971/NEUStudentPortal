import axios from 'axios';
import { RegistProxyUrl, RegistApiKey, PortalClientId } from './proxyConfig';
import { decodeJwt, redirectToLogin } from '@/services/authService';

export const RegistrationApiTimeout = 30000;

const registrationApi = axios.create({
	baseURL: RegistProxyUrl,
	headers: {
		apikey: RegistApiKey,
		clientid: PortalClientId,
		accept: 'application/json, text/plain, */*'
	},
	timeout: RegistrationApiTimeout
});

registrationApi.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('registToken');
		if (token) {
			const tokenData = decodeJwt<{ exp?: number }>(token);
			if (tokenData && tokenData.exp && tokenData.exp * 1000 > Date.now() + 10000) {
				config.headers.authorization = `Bearer ${token}`;
			} else {
				redirectToLogin();
			}
		}
		return config;
	},
	(error) => Promise.reject(error)
);

registrationApi.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			redirectToLogin();
		}
		return Promise.reject(error);
	}
);

export default registrationApi;
