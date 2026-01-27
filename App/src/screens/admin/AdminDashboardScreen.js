import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAdmin } from '../../context/AdminContext';
import { getDashboardStats } from '../../services/adminApi';
import { lightImpact } from '../../utils/haptics';

const StatCard = ({ icon, title, value, color, colors }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
            <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
);

const QuickAction = ({ icon, title, onPress, colors, color = null }) => (
    <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
    >
        <View style={[styles.quickActionIcon, { backgroundColor: color ? `${color}20` : colors.primaryLight }]}>
            <MaterialIcons name={icon} size={24} color={color || colors.primary} />
        </View>
        <Text style={[styles.quickActionText, { color: colors.text }]}>{title}</Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { adminUser, adminLogout, needsPasswordChange } = useAdmin();
    
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, [fetchStats]);

    const handleLogout = useCallback(() => {
        lightImpact();
        adminLogout();
    }, [adminLogout]);

    const navigateToLibraries = () => {
        lightImpact();
        navigation.navigate('AdminLibraries');
    };

    const navigateToAddLibrary = () => {
        lightImpact();
        navigation.navigate('AdminAddLibrary');
    };

    const navigateToSettings = () => {
        lightImpact();
        navigation.navigate('AdminSettings');
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                        Welcome back,
                    </Text>
                    <Text style={[styles.adminName, { color: colors.text }]}>
                        {adminUser?.name || 'Admin'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={20} color="#dc2626" />
                </TouchableOpacity>
            </View>

            {/* Password Change Warning */}
            {needsPasswordChange && (
                <TouchableOpacity
                    style={[styles.warningBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}
                    onPress={navigateToSettings}
                >
                    <MaterialIcons name="warning" size={20} color="#d97706" />
                    <Text style={styles.warningText}>
                        You're using the default password. Tap to change it.
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color="#d97706" />
                </TouchableOpacity>
            )}

            {/* Stats Grid */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        icon="local-library"
                        title="Libraries"
                        value={stats?.totalLibraries || 0}
                        color="#6366f1"
                        colors={colors}
                    />
                    <StatCard
                        icon="event-seat"
                        title="Total Seats"
                        value={stats?.totalSeats || 0}
                        color="#10b981"
                        colors={colors}
                    />
                    <StatCard
                        icon="people"
                        title="Users"
                        value={stats?.totalUsers || 0}
                        color="#f59e0b"
                        colors={colors}
                    />
                    <StatCard
                        icon="book-online"
                        title="Today's Bookings"
                        value={stats?.todayBookings || 0}
                        color="#ec4899"
                        colors={colors}
                    />
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <View style={styles.quickActions}>
                    <QuickAction
                        icon="add-location"
                        title="Add New Library"
                        onPress={navigateToAddLibrary}
                        colors={colors}
                        color="#10b981"
                    />
                    <QuickAction
                        icon="local-library"
                        title="Manage Libraries"
                        onPress={navigateToLibraries}
                        colors={colors}
                    />
                    <QuickAction
                        icon="settings"
                        title="Admin Settings"
                        onPress={navigateToSettings}
                        colors={colors}
                        color="#6b7280"
                    />
                </View>
            </View>

            {/* Active Status */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Status</Text>
                <View style={[styles.liveStatusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.liveStatusRow}>
                        <View style={styles.liveStatusItem}>
                            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                            <Text style={[styles.liveStatusLabel, { color: colors.textSecondary }]}>
                                Available
                            </Text>
                            <Text style={[styles.liveStatusValue, { color: colors.text }]}>
                                {stats?.availableSeats || 0}
                            </Text>
                        </View>
                        <View style={styles.liveStatusDivider} />
                        <View style={styles.liveStatusItem}>
                            <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                            <Text style={[styles.liveStatusLabel, { color: colors.textSecondary }]}>
                                Active Bookings
                            </Text>
                            <Text style={[styles.liveStatusValue, { color: colors.text }]}>
                                {stats?.activeBookings || 0}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    },
    adminName: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 24,
    },
    logoutButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#92400e',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        marginBottom: 4,
    },
    statTitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
    },
    quickActions: {
        gap: 12,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionText: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
    },
    liveStatusCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    liveStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveStatusItem: {
        flex: 1,
        alignItems: 'center',
    },
    liveStatusDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 16,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 8,
    },
    liveStatusLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        marginBottom: 4,
    },
    liveStatusValue: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 24,
    },
});

export default AdminDashboardScreen;
