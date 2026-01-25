import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { selectionChanged } from '../utils/haptics';

const Header = () => {
    const { colors, isDark, toggleTheme, themeMode } = useTheme();
    const { userInfo } = useAuth();

    const handleThemeToggle = () => {
        selectionChanged();
        toggleTheme();
    };

    const getThemeIcon = () => {
        if (themeMode === 'system') return 'brightness-auto';
        if (themeMode === 'dark') return 'dark-mode';
        return 'light-mode';
    };

    // Get user initials for fallback avatar
    const getInitials = () => {
        if (!userInfo) return 'G';
        const first = userInfo.firstName?.[0] || '';
        const last = userInfo.lastName?.[0] || '';
        return (first + last).toUpperCase() || 'U';
    };

    const displayName = userInfo?.fullName || userInfo?.firstName || 'Guest';
    const avatarUrl = userInfo?.imageUrl;

    return (
        <View style={[styles.container, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
            {/* User Info */}
            <View style={styles.userInfo}>
                <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.initialsContainer, { backgroundColor: colors.primary }]}>
                            <Text style={styles.initialsText}>{getInitials()}</Text>
                        </View>
                    )}
                </View>
                <View>
                    <Text style={[styles.appName, { color: colors.primary }]}>StudySync</Text>
                    <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {/* Theme Toggle */}
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={handleThemeToggle}
                    accessibilityLabel={`Theme mode: ${themeMode}. Tap to change.`}
                    accessibilityRole="button"
                >
                    <MaterialIcons name={getThemeIcon()} size={22} color={colors.primary} />
                </TouchableOpacity>

                {/* Notification */}
                <TouchableOpacity
                    style={[styles.notificationButton, { backgroundColor: colors.surfaceSecondary }]}
                    accessibilityLabel="Notifications"
                    accessibilityRole="button"
                >
                    <MaterialIcons name="notifications" size={24} color={colors.textSecondary} />
                    <View style={[styles.notificationDot, { backgroundColor: colors.primary, borderColor: colors.headerBg }]} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 48,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    initialsContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    appName: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 2,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    notificationButton: {
        position: 'relative',
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
    },
});

export default Header;
