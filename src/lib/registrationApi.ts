import axios from "axios";
import { REGIST_PROXY_URL, REGIST_API_KEY, PORTAL_CLIENT_ID } from "./proxyConfig";
import { decodeJwt } from "@/services/authService";

export const REGISTRATION_API_TIMEOUT = 30000;

const registrationApi = axios.create({
	baseURL: REGIST_PROXY_URL,
	headers: {
		apikey: REGIST_API_KEY,
		clientid: PORTAL_CLIENT_ID,
		accept: "application/json, text/plain, */*",
	},
	timeout: REGISTRATION_API_TIMEOUT,
});

registrationApi.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("registToken");
		if (token) {
			const tokenData = decodeJwt<{ exp?: number }>(token);
			if (tokenData && tokenData.exp && tokenData.exp * 1000 > Date.now() + 10000) {
				config.headers.authorization = `Bearer ${token}`;
			} else {
				console.warn("Registration token expired");
				localStorage.removeItem("registToken");
				localStorage.removeItem("registTokenAuthSource");
			}
		}
		return config;
	},
	(error) => Promise.reject(error),
);

registrationApi.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("registToken");
			localStorage.removeItem("registTokenAuthSource");
		}
		return Promise.reject(error);
	},
);

export default registrationApi;
