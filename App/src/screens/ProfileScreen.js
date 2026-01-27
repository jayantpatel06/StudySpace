import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';

const ProfileScreen = () => {
    const {
        locationStatus,
        distanceToLibrary,
        nearestLibrary,
        refreshLocation,
        isLoading,
    } = useLocation();
    const { colors } = useTheme();
    const { userInfo, signOut } = useAuth();
    const { selectedLibrary } = useLibrary();

    const isInRange = locationStatus === 'in_range';

    const handleRefreshLocation = () => {
        if (selectedLibrary) {
            refreshLocation(selectedLibrary);
        }
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
                        await signOut();
                    }
                },
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.profileHeader, { borderBottomColor: colors.border }]}>
                <Image
                    source={{ uri: userInfo?.imageUrl || 'https://via.placeholder.com/96' }}
                    style={styles.avatar}
                />
                <Text style={[styles.name, { color: colors.text }]}>
                    {userInfo?.fullName || 'User'}
                </Text>
                <Text style={[styles.department, { color: colors.textSecondary }]}>
                    {userInfo?.email || ''}
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {userInfo?.points || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {userInfo?.streak || 0}🔥
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {Math.round((userInfo?.totalFocusTime || 0) / 60)}h
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time</Text>
                    </View>
                </View>
            </View>

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
                                    {distanceToLibrary
                                        ? `${Math.round(distanceToLibrary)}m from ${nearestLibrary?.name || 'library'}`
                                        : locationStatus === 'unknown' ? 'Checking location...' : 'GPS location'
                                    }
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleRefreshLocation} disabled={isLoading || !selectedLibrary}>
                            <MaterialIcons
                                name="refresh"
                                size={24}
                                color={isLoading || !selectedLibrary ? colors.textMuted : colors.primary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24, color: colors.textSecondary }]}>Account</Text>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity style={styles.menuRow}>
                        <View style={styles.menuLeft}>
                            <MaterialIcons name="notifications" size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow}>
                        <View style={styles.menuLeft}>
                            <MaterialIcons name="security" size={24} color={colors.textSecondary} />
                            <Text style={[styles.menuText, { color: colors.text }]}>Privacy & Security</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow}>
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
        paddingTop: 48,
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
    logoutText: {
        fontWeight: '600',
        color: '#ef4444',
    },
});

export default ProfileScreen;
