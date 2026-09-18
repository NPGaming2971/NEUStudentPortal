import { getToken } from "./authService";
import { PORTAL_PROXY_URL, REGIST_PROXY_URL } from "../lib/proxyConfig";

const CONFIG = {
	portal_api: `${PORTAL_PROXY_URL}/`,
	regist_api: `${REGIST_PROXY_URL}/`,
	apiKey: "pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzv",
	clientId: "neucq",
};

/**
 * Bước 1: Lấy Refresh Token từ Portal API
 */
export const getRefreshToken = async (portalToken: string): Promise<string> => {
	const response = await fetch(`${CONFIG.portal_api}/Authenticate/GetRefreshToken`, {
		method: "GET",
		headers: {
			accept: "application/json, text/plain, */*",
			apikey: CONFIG.apiKey,
			authorization: `Bearer ${portalToken}`,
			clientid: CONFIG.clientId,
		},
	});

	if (!response.ok) {
		throw new Error(`GetRefreshToken failed: ${response.status}`);
	}

	const refreshToken = await response.text();
	return refreshToken.replace(/"/g, "");
};

export const authenticatePortal = async (refreshToken: string) => {
	const response = await fetch(`${CONFIG.regist_api}/Authen/AuthenticatePortal`, {
		method: "POST",
		headers: {
			accept: "application/json, text/plain, */*",
			"content-type": "application/json",
			apikey: CONFIG.apiKey,
			clientid: CONFIG.clientId,
		},
		body: JSON.stringify({ Token: refreshToken }),
	});

	if (!response.ok) {
		throw new Error(`AuthenticatePortal failed: ${response.status}`);
	}

	const authData = await response.json();
	return authData;
};

export const initializeRegistrationSession = async () => {
	try {
		const portalToken = getToken();
		if (!portalToken) {
			throw new Error("Không tìm thấy token portal");
		}

		const existingRegistToken = localStorage.getItem("registToken");
		const lastAuthToken = localStorage.getItem("registTokenAuthSource");

		if (existingRegistToken && lastAuthToken === portalToken) {
			// Kiểm tra token còn hạn không
			try {
				const tokenData = JSON.parse(atob(existingRegistToken.split(".")[1]));
				// Token còn hạn ít nhất 30 giây
				if (tokenData.exp * 1000 > Date.now() + 30000) {
					return existingRegistToken;
				}
			} catch {
				// Token không hợp lệ, tiếp tục tạo mới
			}
		}

		// Bước 1: Lấy Refresh Token
		const refreshToken = await getRefreshToken(portalToken);

		// Bước 2: Authenticate với Regist API
		const authData = await authenticatePortal(refreshToken);

		if (authData?.Token) {
			// Lưu token đăng ký vào localStorage
			localStorage.setItem("registToken", authData.Token);
			// Lưu token portal gốc để theo dõi thay đổi
			localStorage.setItem("registTokenAuthSource", portalToken);
			return authData.Token;
		}

		throw new Error("Không nhận được token từ hệ thống đăng ký");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("❌ Lỗi flow đăng ký:", message);
		throw error;
	}
};
