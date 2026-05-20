import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface UIContextType {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    toggleDarkMode: () => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | null>(null);

function readInitialDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function useUI(): UIContextType {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error('useUI must be used within <UIProvider>');
    return ctx;
}

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [darkMode, setDarkMode] = useState(readInitialDarkMode);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => !prev);
    }, []);

    const value = useMemo<UIContextType>(() => ({
        darkMode,
        setDarkMode,
        toggleDarkMode,
        sidebarCollapsed,
        setSidebarCollapsed,
    }), [darkMode, toggleDarkMode, sidebarCollapsed]);

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
