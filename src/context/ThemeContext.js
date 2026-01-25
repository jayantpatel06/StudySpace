import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

// Theme color definitions
export const themes = {
    light: {
        background: '#F8F9FA',
        surface: '#FFFFFF',
        surfaceSecondary: '#f1f5f9',
        text: '#202124',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        primary: '#3b82f6',
        primaryLight: 'rgba(59, 130, 246, 0.1)',
        border: '#e2e8f0',
        borderLight: '#f1f5f9',
        available: '#4ade80',
        reserved: '#facc15',
        occupied: '#f87171',
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        overlay: 'rgba(0, 0, 0, 0.1)',
        headerBg: 'rgba(248, 249, 250, 0.8)',
        cardShadow: '#000',
        tabBar: '#ffffff',
        tabBarBorder: '#f1f5f9',
    },
    dark: {
        background: '#121212',
        surface: '#1E1E1E',
        surfaceSecondary: '#2a2a2a',
        text: '#E8EAED',
        textSecondary: '#9aa0a6',
        textMuted: '#6e7681',
        primary: '#60a5fa',
        primaryLight: 'rgba(96, 165, 250, 0.15)',
        border: '#3c4043',
        borderLight: '#2a2a2a',
        available: '#4ade80',
        reserved: '#facc15',
        occupied: '#f87171',
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        overlay: 'rgba(255, 255, 255, 0.1)',
        headerBg: 'rgba(30, 30, 30, 0.9)',
        cardShadow: '#000',
        tabBar: '#1E1E1E',
        tabBarBorder: '#3c4043',
    },
};

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    // 'system' | 'light' | 'dark'
    const [themeMode, setThemeMode] = useState('system');

    const activeTheme = themeMode === 'system'
        ? (systemColorScheme || 'light')
        : themeMode;

    const colors = themes[activeTheme];
    const isDark = activeTheme === 'dark';

    const toggleTheme = () => {
        setThemeMode(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light';
        });
    };

    const setTheme = (mode) => {
        if (['light', 'dark', 'system'].includes(mode)) {
            setThemeMode(mode);
        }
    };

    return (
        <ThemeContext.Provider value={{
            themeMode,
            activeTheme,
            isDark,
            colors,
            toggleTheme,
            setTheme,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
