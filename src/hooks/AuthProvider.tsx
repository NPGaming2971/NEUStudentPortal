import { useState, type ReactNode } from 'react';
import {
	isTokenValid,
	getToken,
	setToken as saveToken,
	logout as logoutService,
	getUserFromToken,
	type User,
	type AuthData
} from '@/services/authService';
import { AuthContext, type AuthContextType } from './useAuth';

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isTokenValid());
	const [user, setUser] = useState<User | null>(() => getUserFromToken());
	const [token, setToken] = useState<string | null>(() => getToken());

	const login = (newToken: string, authData?: AuthData) => {
		saveToken(newToken, authData);
		setToken(newToken);
		setIsAuthenticated(true);
		setUser(getUserFromToken());
	};

	const logout = () => {
		logoutService();
		setToken(null);
		setIsAuthenticated(false);
		setUser(null);
	};

	const checkAuth = (): boolean => {
		const valid = isTokenValid();
		if (!valid && isAuthenticated) {
			logout();
		}
		return valid;
	};

	const value: AuthContextType = {
		isAuthenticated,
		user,
		token,
		login,
		logout,
		checkAuth
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
