import { getToken, isTokenExpired } from './authService';
import { PortalProxyUrl, RegistProxyUrl, PortalClientId, PortalApiKey } from '../lib/proxyConfig';

/**
 * Bước 1: Lấy Refresh Token từ Portal API
 */
export const getRefreshToken = async (portalToken: string): Promise<string> => {
	const response = await fetch(`${PortalProxyUrl}/Authenticate/GetRefreshToken`, {
		method: 'GET',
		headers: {
			accept: 'application/json, text/plain, */*',
			apikey: PortalApiKey,
			authorization: `Bearer ${portalToken}`,
			clientid: PortalClientId
		}
	});

	if (!response.ok) {
		throw new Error(`GetRefreshToken failed: ${response.status}`);
	}

	const refreshToken = await response.text();
	return refreshToken.replace(/"/g, '');
};

export const authenticatePortal = async (refreshToken: string) => {
	const response = await fetch(`${RegistProxyUrl}/Authen/AuthenticatePortal`, {
		method: 'POST',
		headers: {
			accept: 'application/json, text/plain, */*',
			'content-type': 'application/json',
			apikey: PortalApiKey,
			clientid: PortalClientId
		},
		body: JSON.stringify({ Token: refreshToken })
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
			throw new Error('Không tìm thấy token portal');
		}

		const existingRegistToken = localStorage.getItem('registToken');
		const lastAuthToken = localStorage.getItem('registTokenAuthSource');

		if (existingRegistToken && lastAuthToken === portalToken && !isTokenExpired(existingRegistToken, 30000)) {
			// Token còn hạn ít nhất 30 giây
			return existingRegistToken;
		}

		// Bước 1: Lấy Refresh Token
		const refreshToken = await getRefreshToken(portalToken);

		// Bước 2: Authenticate với Regist API
		const authData = await authenticatePortal(refreshToken);

		if (authData?.Token) {
			// Lưu token đăng ký vào localStorage
			localStorage.setItem('registToken', authData.Token);
			// Lưu token portal gốc để theo dõi thay đổi
			localStorage.setItem('registTokenAuthSource', portalToken);
			return authData.Token;
		}

		throw new Error('Không nhận được token từ hệ thống đăng ký');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ Lỗi flow đăng ký:', message);
		throw error;
	}
};
