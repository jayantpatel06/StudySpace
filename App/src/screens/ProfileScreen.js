import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking, Switch, Clipboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useNotifications } from '../hooks/useOffline';
import { successNotification } from '../utils/haptics';

const ProfileScreen = () => {
    const {
        locationStatus,
        distanceToLibrary,
        nearestLibrary,
        refreshLocation,
        isLoading,
        permissionGranted,
    } = useLocation();
    const { colors } = useTheme();
    const { userInfo, signOut } = useAuth();
    const { selectedLibrary } = useLibrary();
    const { hasPermission: hasNotificationPermission } = useNotifications();
    const insets = useSafeAreaInsets();

    const isInRange = locationStatus === 'in_range';

    const displayName = userInfo?.fullName || userInfo?.firstName || 'Guest';
    const email = userInfo?.email || '';
    const avatarUrl = userInfo?.imageUrl;
    const points = userInfo?.points;
    const streak = userInfo?.streak;
    const studentCode = userInfo?.studentCode;
    const focusHours = typeof userInfo?.totalFocusTime === 'number'
        ? Math.round(userInfo.totalFocusTime / 60)
        : null;

    const getInitials = () => {
        if (!userInfo) return 'G';
        const first = userInfo.firstName?.[0] || '';
        const last = userInfo.lastName?.[0] || '';
        const initials = (first + last).toUpperCase();
        return initials || 'U';
    };

    const handleCopyStudentCode = () => {
        if (studentCode) {
            Clipboard.setString(studentCode);
            successNotification();
            Alert.alert('Copied!', 'Your student code has been copied to clipboard. Share it with library administrators to subscribe to their libraries.');
        }
    };

    const handleRefreshLocation = () => {
        if (selectedLibrary) {
            refreshLocation(selectedLibrary);
        }
    };

    const handleOpenLocationSettings = () => {
        if (Linking.openSettings) {
            Linking.openSettings();
        }
    };

    const handleNotificationToggle = async (value) => {
        if (value) {
            // User wants to enable notifications
            if (!hasNotificationPermission) {
                Alert.alert(
                    'Enable Notifications',
                    'To receive booking reminders and focus session updates, please enable notifications in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                if (Linking.openSettings) {
                                    Linking.openSettings();
                                }
                            },
                        },
                    ]
                );
            }
        } else {
            // User wants to disable notifications
            Alert.alert(
                'Disable Notifications',
                'To disable notifications, please go to your device settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings',
                        onPress: () => {
                            if (Linking.openSettings) {
                                Linking.openSettings();
                            }
                        },
                    },
                ]
            );
        }
    };

    const handlePrivacyPress = () => {
        Alert.alert(
            'Privacy & Security',
            'Privacy and security controls will be available in a future update.'
        );
    };

    const handleHelpPress = () => {
        Alert.alert(
            'Help & Support',
            'For help, please contact your library staff or administrator.'
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to log out. Please try again.');
                        }
                    }
                },
            ]
        );
    };

    const locationSubtitle = !permissionGranted
        ? 'Location permission is turned off. Open settings to enable.'
        : distanceToLibrary
            ? `${Math.round(distanceToLibrary)}m from ${nearestLibrary?.name || 'library'}`
            : locationStatus === 'unknown'
                ? 'Checking location...'
                : 'GPS location';

    const isRefreshDisabled = permissionGranted ? (isLoading || !selectedLibrary) : false;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
            contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
        >
            <View style={[styles.profileHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.avatar}>
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarInitials}>{getInitials()}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.name, { color: colors.text }]}>
                    {displayName}
                </Text>
                <Text style={[styles.department, { color: colors.textSecondary }]}>
                    {email}
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {points != null ? points : '--'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {streak != null ? `${streak}🔥` : '--'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {focusHours != null ? `${focusHours}h` : '--'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time</Text>
                    </View>
                </View>
            </View>

            {/* Student Code Section */}
            {studentCode && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Student Code</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.studentCodeContainer}>
                            <View style={styles.studentCodeLeft}>
                                <MaterialIcons name="qr-code" size={24} color={colors.primary} />
                                <View>
                                    <Text style={[styles.studentCodeLabel, { color: colors.textMuted }]}>
                                        Share this code with library administrators
                                    </Text>
                                    <Text style={[styles.studentCode, { color: colors.text }]}>
                                        {studentCode}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={handleCopyStudentCode}
                                style={[styles.copyButton, { backgroundColor: colors.primaryLight }]}
                            >
                                <MaterialIcons name="content-copy" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.studentCodeHint, { color: colors.textMuted }]}>
                            Library owners use this code to subscribe you to their library.
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Location Status</Text>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    {/* GPS Status */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <MaterialIcons
                                name={isInRange ? "location-on" : "location-off"}
                                size={24}
                                color={isInRange ? colors.success : colors.textSecondary}
                            />
                            <View>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>
                                    {isInRange ? 'In Library Range' : 'Outside Library'}
                                </Text>
                                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                    {locationSubtitle}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={permissionGranted ? handleRefreshLocation : handleOpenLocationSettings}
                            disabled={isRefreshDisabled}
                        >
                            <MaterialIcons
                                name={permissionGranted ? 'refresh' : 'settings'}
                                size={24}
                                color={
                                    permissionGranted
                                        ? (isRefreshDisabled ? colors.textMuted : colors.primary)
                                        : colors.primary
                                }
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24, color: colors.textSecondary }]}>Account</Text>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.menuRow}>
                        <View style={styles.menuLeft}>
                            <MaterialIcons
                                name={hasNotificationPermission ? "notifications-active" : "notifications-off"}
                                size={24}
                                color={hasNotificationPermission ? colors.primary : colors.textSecondary}
                            />
                            <View>
                                <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
                                <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                                    {hasNotificationPermission ? 'Enabled' : 'Disabled'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={hasNotificationPermission}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={hasNotificationPermission ? colors.primary : colors.textMuted}
                        />
                    </View>
                    <TouchableOpacity style={styles.menuRow} onPress={handlePrivacyPress}>
                        <View style={styles.menuLeft}>
                            <MaterialIcons name="security" size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>Privacy & Security</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow} onPress={handleHelpPress}>
                        <View style={styles.menuLeft}>
                            <MaterialIcons name="help-outline" size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRowLast} onPress={handleLogout}>
                        <View style={styles.menuLeft}>
                            <MaterialIcons name="logout" size={24} color="#ef4444" />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileHeader: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
    },
    avatarFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 48,
    },
    avatarInitials: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '700',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
    },
    department: {
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 24,
        width: '100%',
        justifyContent: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    divider: {
        width: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        paddingHorizontal: 8,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingTitle: {
        fontWeight: '600',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    menuRowLast: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuText: {
        fontWeight: '600',
    },
    menuSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    logoutText: {
        fontWeight: '600',
        color: '#ef4444',
    },
    studentCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    studentCodeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    studentCodeLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    studentCode: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    copyButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    studentCodeHint: {
        fontSize: 12,
        paddingHorizontal: 16,
        paddingBottom: 16,
        lineHeight: 18,
    },
});

export default ProfileScreen;
