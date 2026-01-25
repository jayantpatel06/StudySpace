import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ToastContext = createContext();

/**
 * Toast notification component
 */
const Toast = ({ message, type, visible }) => {
    const { colors } = useTheme();

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return { icon: 'check-circle', color: colors.success };
            case 'error':
                return { icon: 'error', color: colors.error };
            case 'warning':
                return { icon: 'warning', color: colors.warning };
            default:
                return { icon: 'info', color: colors.primary };
        }
    };

    const config = getToastConfig();

    if (!visible) return null;

    return (
        <View style={[styles.toast, { backgroundColor: colors.surface }]}>
            <MaterialIcons name={config.icon} size={20} color={config.color} />
            <Text style={[styles.toastText, { color: colors.text }]}>{message}</Text>
        </View>
    );
};

/**
 * Toast Provider - wrap your app with this to enable toasts
 */
export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, duration);
    }, []);

    const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
    const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);
    const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <Toast {...toast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    toastText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
});

export default Toast;
