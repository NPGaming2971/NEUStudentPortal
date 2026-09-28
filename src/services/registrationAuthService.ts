import { Endpoints } from '@/lib/endpoints';
import registrationApi, { type RegistrationRequestConfig } from '@/lib/registrationApi';
import { httpErrorMessage, httpErrorStatus, responseMessage } from '@/lib/httpError';
import { getRegistToken, setRegistToken } from '@/lib/storage';
import { isTokenExpired } from './authService';

/**
 * Đăng nhập trực tiếp vào hệ thống đăng ký học phần (tinchi) bằng mã sinh viên
 * và mật khẩu — không còn phụ thuộc vào GetRefreshToken của cổng thông tin.
 */
export const loginRegist = async (username: string, password: string): Promise<void> => {
	try {
		const response = await registrationApi.post(Endpoints.Regist.Authenticate, { username, password }, {
			skipAuth: true
		} as RegistrationRequestConfig);
		const authData = response.data as { Token?: string } | null;
		if (authData?.Token) {
			setRegistToken(authData.Token);
			return;
		}
		throw new Error(responseMessage(response.data) ?? 'Đăng nhập thất bại');
	} catch (error) {
		const status = httpErrorStatus(error);
		if (status === 401 || status === 403) {
			throw new Error('Sai mã sinh viên hoặc mật khẩu');
		}
		throw new Error(httpErrorMessage(error));
	}
};

export const getRegistSession = (): string | null => {
	const token = getRegistToken();
	return token && !isTokenExpired(token, 30000) ? token : null;
};

export const initializeRegistrationSession = async (): Promise<string | null> => getRegistSession();
