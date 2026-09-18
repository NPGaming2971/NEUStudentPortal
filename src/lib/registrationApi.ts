import axios from "axios";
import { REGIST_PROXY_URL } from "./proxyConfig";

export const REGISTRATION_API_TIMEOUT = 30000;

const registrationApi = axios.create({
	baseURL: REGIST_PROXY_URL,
	headers: {
		apikey: "pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzv",
		clientid: "neucq",
		accept: "application/json, text/plain, */*",
	},
	timeout: REGISTRATION_API_TIMEOUT,
});

registrationApi.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("registToken");
		if (token) {
			try {
				const tokenData = JSON.parse(atob(token.split(".")[1]));
				if (tokenData.exp * 1000 > Date.now() + 10000) {
					config.headers.authorization = `Bearer ${token}`;
				} else {
					console.warn("Registration token expired");
					localStorage.removeItem("registToken");
					localStorage.removeItem("registTokenAuthSource");
				}
			} catch {
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
