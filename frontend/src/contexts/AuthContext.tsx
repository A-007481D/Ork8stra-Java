import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authApi from '../api/auth';
import type { LoginRequest, RegisterRequest, TokenResponse } from '../types';

interface AuthUser {
    username: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Decode JWT and check if it's expired
    const isTokenValid = (token: string): boolean => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // exp is in seconds, Date.now() is in ms
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    };

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            if (isTokenValid(storedToken)) {
                setToken(storedToken);
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    localStorage.removeItem('user');
                }
            } else {
                // Token is expired — clear everything
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    // Protect routes
    useEffect(() => {
        if (!isLoading) {
            const publicRoutes = ['/', '/login', '/register'];
            if (!token && !publicRoutes.includes(location.pathname)) {
                navigate('/login');
            } else if (token && publicRoutes.includes(location.pathname)) {
                navigate('/dashboard');
            }
        }
    }, [isLoading, token, location.pathname, navigate]);

    const handleAuthSuccess = useCallback((response: TokenResponse) => {
        const newUser: AuthUser = { username: response.username };

        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        setToken(response.accessToken);
        setUser(newUser);
        // Navigation is handled by the useEffect above
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        const response = await authApi.login(data);
        handleAuthSuccess(response);
    }, [handleAuthSuccess]);

    const register = useCallback(async (data: RegisterRequest) => {
        const response = await authApi.register(data);
        handleAuthSuccess(response);
    }, [handleAuthSuccess]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
    };

    if (isLoading) {
        return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-muted">Loading...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
