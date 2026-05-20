import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { User } from '../types';
import { authApi, setToken } from '../services/api';
import { getAuthSessionBridge } from './authSessionBridge';

export const EMPTY_USER: User = {
    id: '', accountId: '', name: '', email: '', phone: '',
    roles: [], userType: 'Internal', status: 'Active',
} as User;

export interface AuthContextType {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    needsLogin: boolean;
    setNeedsLogin: React.Dispatch<React.SetStateAction<boolean>>;
    login: (email: string, password: string) => Promise<void>;
    completeSsoLogin: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
    const [needsLogin, setNeedsLogin] = useState(false);

    const login = useCallback(async (email: string, password: string) => {
        const { token, user } = await authApi.login(email, password);
        setToken(token);
        setCurrentUser(user);
        getAuthSessionBridge()?.onBeforeLoginReset?.();
        setNeedsLogin(false);
        await getAuthSessionBridge()?.onAfterLogin();
    }, []);

    const completeSsoLogin = useCallback(async (token: string) => {
        setToken(token);
        getAuthSessionBridge()?.onBeforeLoginReset?.();
        setNeedsLogin(false);
        await getAuthSessionBridge()?.onAfterLogin();
    }, []);

    const logout = useCallback(async () => {
        try { await authApi.logout(); } catch { /* noop */ }
        setToken(null);
        getAuthSessionBridge()?.onAfterLogout();
        setNeedsLogin(true);
    }, []);

    const value = useMemo<AuthContextType>(() => ({
        currentUser,
        setCurrentUser,
        needsLogin,
        setNeedsLogin,
        login,
        completeSsoLogin,
        logout,
    }), [currentUser, needsLogin, login, completeSsoLogin, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
