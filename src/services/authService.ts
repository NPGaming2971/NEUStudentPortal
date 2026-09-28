import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';
import { httpErrorMessage, httpErrorStatus, responseMessage } from '@/lib/httpError';
import { clearAuthStorage, getStoredToken, setStoredAuthorizationData } from '@/lib/storage';

export interface AuthData {
	Id: string;
	FirstName?: string | null;
	LastName?: string | null;
	FullName: string;
	Token: string;
	Role: string;
	GraduateLevel: string;
	StudyTypeID?: string;
	DVDaoTao?: string;
	Expire?: string;
}

export interface User {
	id: string;
	fullName: string;
	role: string;
	graduateLevel: string;
	dvDaoTao?: string;
}

export const login = async (username: string, password: string): Promise<AuthData> => {
	try {
		const response = await api.post(Endpoints.Auth.Login, {
			username,
			password
		});
		if (response.data?.Token) {
			return response.data;
		}
		throw new Error(responseMessage(response.data) ?? 'Đăng nhập thất bại');
	} catch (error) {
		const status = httpErrorStatus(error);
		if (status === 401 || status === 403) {
			throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
		}
		throw new Error(httpErrorMessage(error));
	}
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<{ Message: string }> => {
	try {
		const response = await api.post(Endpoints.Auth.ChangePassword, {
			p1: oldPassword,
			p2: newPassword
		});
		return response.data;
	} catch (error) {
		console.error('Error changing password:', error);
		throw error;
	}
};

export const requestPasswordReset = async (username: string, email: string): Promise<string> => {
	try {
		const response = await api.post(Endpoints.Auth.ResetPassword, {
			p1: username,
			p2: email
		});
		return responseMessage(response.data) ?? 'Vui lòng kiểm tra email để đặt lại mật khẩu';
	} catch (error) {
		throw new Error(httpErrorMessage(error));
	}
};

export const clearSession = (): void => {
	clearAuthStorage();
	document.cookie = 'YIF+pxrGp0isUkYUsAWxn3rQH6pBrNY_=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export const redirectToLogin = (): void => {
	clearSession();
	if (window.location.pathname !== '/login') {
		window.location.href = '/login';
	}
};

export const logout = (): void => {
	clearSession();
};

export interface JwtPayload {
	exp?: number;
	Id?: string;
	StudentID?: string;
	Name?: string;
	Role?: string;
	GraduateLevel?: string;
	DVDaoTao?: string;
}

export const decodeJwt = <T = JwtPayload>(token: string): T | null => {
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		return payload && typeof payload === 'object' ? (payload as T) : null;
	} catch {
		return null;
	}
};

export const isTokenExpired = (token: string | null, marginMs = 0): boolean => {
	if (!token) return true;
	const payload = decodeJwt<{ exp?: number }>(token);
	if (!payload || typeof payload.exp !== 'number') return true;
	return payload.exp * 1000 <= Date.now() + marginMs;
};

export const getToken = (): string | null => getStoredToken();

export const getTokenPayload = (): JwtPayload | null => {
	const token = getToken();
	if (!token) return null;
	return decodeJwt(token);
};

export const getStudentId = (): string => {
	const payload = getTokenPayload();
	if (!payload) return '';
	return payload.Id || payload.StudentID || '';
};

export const setToken = (token: string, authData?: AuthData): void => {
	setStoredAuthorizationData({ ...authData, Token: token });
};

export const isTokenValid = (): boolean => {
	return !isTokenExpired(getToken());
};

export const getUserFromToken = (): User | null => {
	const payload = getTokenPayload();
	if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
		return null;
	}
	return {
		id: payload.Id || '',
		fullName: payload.Name || '',
		role: payload.Role || '',
		graduateLevel: payload.GraduateLevel || '',
		dvDaoTao: payload.DVDaoTao
	};
};
