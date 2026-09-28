import axios, { type AxiosRequestConfig } from 'axios';
import { RegistProxyUrl, RegistApiKey, RegistClientId } from './proxyConfig';
import { decodeJwt } from '@/services/authService';
import { getRegistToken } from './storage';

export const RegistrationApiTimeout = 30000;

export interface RegistrationRequestConfig extends AxiosRequestConfig {
	skipAuth?: boolean;
}

export const RegistUnauthorizedEvent = 'regist-unauthorized';

const registrationApi = axios.create({
	baseURL: RegistProxyUrl,
	headers: {
		apikey: RegistApiKey,
		clientid: RegistClientId,
		accept: 'application/json, text/plain, */*'
	},
	timeout: RegistrationApiTimeout
});

const rejectRegistAuth = (error?: unknown): Promise<never> => {
	window.dispatchEvent(new Event(RegistUnauthorizedEvent));
	return Promise.reject(error instanceof Error ? error : new Error('Phiên đăng nhập hệ thống đăng ký không hợp lệ'));
};

registrationApi.interceptors.request.use(
	(config) => {
		if (!(config as RegistrationRequestConfig).skipAuth) {
			const token = getRegistToken();
			if (token) {
				const tokenData = decodeJwt<{ exp?: number }>(token);
				if (tokenData && tokenData.exp && tokenData.exp * 1000 > Date.now() + 10000) {
					config.headers.authorization = `Bearer ${token}`;
				} else {
					return rejectRegistAuth();
				}
			} else {
				return rejectRegistAuth();
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
			return rejectRegistAuth(error);
		}
		return Promise.reject(error);
	}
);

export default registrationApi;
