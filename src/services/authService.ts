import api from '@/lib/api';

export interface LoginResponse {
    success: boolean;
    data?: AuthData;
    message?: string;
}

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

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await api.post('/authenticate/authpsc', {
            username,
            password,
        });

        if (response.data && response.data.Token) {
            return {
                success: true,
                data: response.data,
            };
        }
        return { success: false, message: 'Đăng nhập thất bại' };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        };
    }
};

export const logout = (): void => {
    localStorage.removeItem('authorizationData');
    document.cookie = 'YIF+pxrGp0isUkYUsAWxn3rQH6pBrNY_=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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

export const getToken = (): string | null => {
    const raw = localStorage.getItem('authorizationData');
    if (!raw) return null;
    try {
        return JSON.parse(raw).Token ?? null;
    } catch {
        return null;
    }
};

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
    localStorage.setItem('authorizationData', JSON.stringify({ ...authData, Token: token }));
};

export const isTokenValid = (): boolean => {
    const payload = getTokenPayload();
    if (!payload || typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now();
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
        dvDaoTao: payload.DVDaoTao,
    };
};
