import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    isTokenValid,
    getToken,
    setToken as saveToken,
    logout as logoutService,
    getUserFromToken,
    type User,
    type LoginResponse,
} from '@/services/authService';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (token: string, authData?: LoginResponse['data']) => void;
    logout: () => void;
    checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isTokenValid());
    const [user, setUser] = useState<User | null>(() => getUserFromToken());
    const [token, setToken] = useState<string | null>(() => getToken());

    useEffect(() => {
        const valid = isTokenValid();
        setIsAuthenticated(valid);
        if (valid) {
            setUser(getUserFromToken());
            setToken(getToken());
        } else {
            setUser(null);
            setToken(null);
        }
    }, []);

    const login = (newToken: string, authData?: LoginResponse['data']) => {
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
            // Token expired, update state
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
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
