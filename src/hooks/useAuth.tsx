import { createContext, useContext } from 'react';
import type { User, AuthData } from '@/services/authService';

export interface AuthContextType {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
	login: (token: string, authData?: AuthData) => void;
	logout: () => void;
	checkAuth: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
