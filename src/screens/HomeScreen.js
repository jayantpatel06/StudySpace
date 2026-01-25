import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../context/LocationContext';
import { useBooking } from '../context/BookingContext';
import { useTheme } from '../context/ThemeContext';
import SkeletonLoader, { SkeletonCard } from '../components/SkeletonLoader';
import OfflineIndicator from '../components/OfflineIndicator';
import { lightImpact } from '../utils/haptics';


const HomeScreen = () => {
    const navigation = useNavigation();
    const { locationStatus } = useLocation();
    const { activeBooking, cancelBooking, completeBooking } = useBooking();
    const { colors, isDark } = useTheme();
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    // Simulate loading state
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!activeBooking) {
            setRemainingSeconds(null);
            setIsExpired(false);
            return undefined;
        }

        const tick = () => {
            const seconds = Math.max(0, Math.floor((activeBooking.expiresAt - Date.now()) / 1000));
            setRemainingSeconds(seconds);

            // Handle booking expiry
            if (seconds === 0 && !isExpired) {
                setIsExpired(true);
                completeBooking(activeBooking.id);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [activeBooking, isExpired, completeBooking]);

    const handleCheckout = () => {
        if (activeBooking) {
            lightImpact();
            cancelBooking(activeBooking.id);
        }
    };

    const handleNavigate = (screen, params) => {
        lightImpact();
        navigation.navigate(screen, params);
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            lightImpact();
            navigation.navigate('Map', { searchQuery: searchQuery.trim() });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
                    <View style={styles.heroSection}>
                        <SkeletonLoader variant="text" width="80%" height={28} style={{ marginBottom: 16 }} />
                        <SkeletonLoader variant="rect" width="100%" height={56} style={{ borderRadius: 16 }} />
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
                        <SkeletonLoader variant="rect" width="100%" height={40} style={{ borderRadius: 8, marginBottom: 24 }} />
                        <SkeletonLoader variant="rect" width="100%" height={192} style={{ borderRadius: 12, marginBottom: 32 }} />
                        <SkeletonLoader variant="text" width={120} height={20} style={{ marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <SkeletonLoader variant="rect" width="47%" height={120} style={{ borderRadius: 12 }} />
                            <SkeletonLoader variant="rect" width="47%" height={120} style={{ borderRadius: 12 }} />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <OfflineIndicator />
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Search Bar & Hero */}
                <View style={styles.heroSection}>
                    {!activeBooking ? (
                        <>
                            <Text style={[styles.heroTitle, { color: colors.text }]}>
                                Where are you studying today?
                            </Text>
                            <View style={styles.searchContainer}>
                                <TouchableOpacity
                                    style={styles.searchIconContainer}
                                    onPress={handleSearch}
                                >
                                    <MaterialIcons name="search" size={24} color={colors.textMuted} />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.searchInput, {
                                        backgroundColor: colors.surface,
                                        color: colors.text,
                                        shadowColor: colors.cardShadow
                                    }]}
                                    placeholder="Search seats, floors, zones..."
                                    placeholderTextColor={colors.textMuted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.clearButton}
                                        onPress={() => setSearchQuery('')}
                                    >
                                        <MaterialIcons name="close" size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    ) : (
                        <View style={[styles.activeBookingCard, {
                            backgroundColor: colors.surface,
                            shadowColor: colors.cardShadow
                        }]}>
                            <Text style={[styles.activeBookingTitle, { color: colors.text }]}>Active Booking</Text>
                            <View style={styles.timerRow}>
                                <Text style={[styles.timerText, { color: colors.primary }]}>
                                    {remainingSeconds !== null
                                        ? `${Math.floor(remainingSeconds / 60)
                                            .toString()
                                            .padStart(2, '0')}:${(remainingSeconds % 60)
                                                .toString()
                                                .padStart(2, '0')}`
                                        : '--:--'}
                                </Text>
                                <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>remaining</Text>
                            </View>
                            <View style={[styles.seatInfoRow, { backgroundColor: colors.surfaceSecondary }]}>
                                <View style={styles.seatInfo}>
                                    <MaterialIcons name="event-seat" size={20} color={colors.primary} />
                                    <Text style={[styles.seatText, { color: colors.text }]}>Seat {activeBooking.seatId}</Text>
                                </View>
                                <Text style={[styles.locationText, { color: colors.textSecondary }]}>{activeBooking.location || 'Library'}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.checkoutButton, { backgroundColor: colors.surfaceSecondary }]}
                                onPress={handleCheckout}
                            >
                                <Text style={[styles.checkoutButtonText, { color: colors.textSecondary }]}>Check Out</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Live Stats Ticker */}
                <View style={[styles.tickerContainer, { backgroundColor: colors.primaryLight }]}>
                    <View style={[styles.tickerDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.tickerText, { color: colors.textSecondary }]}>
                        Current Library Capacity: 64% • Level 3 Quiet Zone is filling up fast!
                    </Text>
                </View>

                {/* Quick Find Button */}
                {!activeBooking && (
                    <TouchableOpacity
                        style={[styles.quickFindButton, {
                            backgroundColor: colors.surface,
                            borderColor: colors.borderLight,
                            shadowColor: colors.cardShadow
                        }]}
                        onPress={() => handleNavigate('Map')}
                    >
                        <MaterialIcons name="near-me" size={20} color={colors.primary} />
                        <Text style={[styles.quickFindText, { color: colors.primary }]}>Find Nearest Available Seat</Text>
                    </TouchableOpacity>
                )}

                {/* Live Occupancy / Map Preview */}
                <View style={styles.occupancySection}>
                    <View style={styles.occupancyHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Occupancy</Text>
                        <View style={styles.liveBadge}>
                            <Text style={styles.liveBadgeText}>LIVE</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.mapPreview}
                        onPress={() => handleNavigate('Map')}
                    >
                        <Image
                            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4s1-oQyJuYjjbHKFJ_LL-hZBOeJXZ4c6266SWODZD8mOF-8apaJmfShRdEykyHl5GwGFGbz3vP4bv-k6k-ynQc1EAMMWmq5pvZJ_0MPlosRcAWqEwi-7VM8KHK2h4Q0NyPGWe6M7aLXfalWtWQlawERpj6o2EZ-ddMBGWX4uuXYaZVkLaVZ3jT-1vs9EmZH4QJvRSryKriQzBAq9-DAwoQ3pn3sVNi-WoLcXGuOsj6XYhXdRihFIkUOnunUTRrB4N6_x9FFbOWBX-" }}
                            style={styles.mapImage}
                            resizeMode="cover"
                        />
                        <View style={styles.mapOverlay} />
                        <View style={styles.mapInfo}>
                            <Text style={styles.mapInfoTitle}>Level 3 • Zone C</Text>
                            <Text style={styles.mapInfoSubtitle}>24 seats available</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.actionsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={[styles.actionCard, {
                                backgroundColor: colors.surface,
                                borderColor: colors.borderLight,
                                shadowColor: colors.cardShadow
                            }]}
                            onPress={() => handleNavigate('FocusTimer')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                                <MaterialIcons name="timer" size={24} color={colors.primary} />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>Focus Room</Text>
                            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Start session</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, {
                                backgroundColor: colors.surface,
                                borderColor: colors.borderLight,
                                shadowColor: colors.cardShadow
                            }]}
                            onPress={() => handleNavigate('Rewards')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff' }]}>
                                <MaterialIcons name="emoji-events" size={24} color="#a855f7" />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>Rewards</Text>
                            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>View progress</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Quick Action FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => handleNavigate('QRScan')}
            >
                <MaterialIcons name="qr-code-scanner" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#202124',
        marginBottom: 16,
    },
    searchContainer: {
        position: 'relative',
        justifyContent: 'center',
        marginBottom: 16,
    },
    searchIconContainer: {
        position: 'absolute',
        left: 16,
        zIndex: 10,
    },
    clearButton: {
        position: 'absolute',
        right: 16,
        zIndex: 10,
        padding: 4,
    },
    searchInput: {
        width: '100%',
        paddingLeft: 48,
        paddingRight: 48,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        fontSize: 16,
        color: '#202124',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activeBookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        borderTopWidth: 4,
        borderTopColor: '#3b82f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeBookingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202124',
        marginBottom: 8,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 16,
    },
    timerText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#3b82f6',
    },
    timerLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    seatInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    seatInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    seatText: {
        fontWeight: '700',
        color: '#202124',
    },
    locationText: {
        fontSize: 12,
        color: '#64748b',
    },
    checkoutButton: {
        width: '100%',
        backgroundColor: '#f1f5f9',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 14,
    },
    tickerContainer: {
        backgroundColor: '#eff6ff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 24,
        marginHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tickerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    tickerText: {
        fontSize: 12,
        color: '#475569',
        fontStyle: 'italic',
        flex: 1,
    },
    quickFindButton: {
        marginHorizontal: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    quickFindText: {
        color: '#3b82f6',
        fontWeight: '700',
        fontSize: 14,
    },
    occupancySection: {
        paddingHorizontal: 16,
    },
    occupancyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202124',
    },
    liveBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    liveBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#dc2626',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mapPreview: {
        height: 192,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    mapInfo: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    mapInfoTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1f2937',
    },
    mapInfoSubtitle: {
        fontSize: 10,
        color: '#64748b',
    },
    actionsSection: {
        paddingHorizontal: 16,
        marginTop: 32,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        marginTop: 16,
    },
    actionCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontWeight: '700',
        color: '#202124',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});

export default HomeScreen;
