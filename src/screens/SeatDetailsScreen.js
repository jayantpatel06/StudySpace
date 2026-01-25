import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useLocation } from '../context/LocationContext';
import { useBooking } from '../context/BookingContext';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../components/Toast';
import { successNotification, lightImpact, selectionChanged } from '../utils/haptics';

const amenities = [
    { icon: 'power', label: 'Power', color: '#2563eb', bg: '#eff6ff', bgDark: 'rgba(37, 99, 235, 0.15)' },
    { icon: 'lightbulb', label: 'Lamp', color: '#ea580c', bg: '#fff7ed', bgDark: 'rgba(234, 88, 12, 0.15)' },
    { icon: 'chair-alt', label: 'Ergo Chair', color: '#9333ea', bg: '#f5f3ff', bgDark: 'rgba(147, 51, 234, 0.15)' },
    { icon: 'wifi', label: 'Gigabit', color: '#0d9488', bg: '#ecfeff', bgDark: 'rgba(13, 148, 136, 0.15)' },
];

const SeatDetailsScreen = ({ route }) => {
    const navigation = useNavigation();
    const { seatId } = route.params || { seatId: 'A-42' }; // Default for dev
    const { locationStatus, refreshLocation, setTargetLibrary, distanceToLibrary } = useLocation();
    const { createBooking } = useBooking();
    const { colors, isDark } = useTheme();
    const { selectedLibrary } = useLibrary();
    const { showSuccess, showError } = useToast();

    const [duration, setDuration] = useState(120); // minutes

    // Sync library and refresh location when screen mounts
    useEffect(() => {
        if (selectedLibrary) {
            // setTargetLibrary already calls refreshLocation internally
            setTargetLibrary(selectedLibrary);
        }
    }, [selectedLibrary?.id]); // Only trigger when library ID changes

    const handleBooking = async () => {
        // First refresh location to get latest status
        if (selectedLibrary) {
            await refreshLocation(selectedLibrary);
        }

        if (locationStatus !== 'in_range') {
            const distanceMsg = distanceToLibrary 
                ? `You are ${distanceToLibrary}m away. ` 
                : '';
            const radiusMsg = selectedLibrary 
                ? `You need to be within ${selectedLibrary.radius_meters || 100}m of ${selectedLibrary.name}.`
                : 'Please select a library first.';
            showError(`${distanceMsg}${radiusMsg}`);
            return;
        }

        try {
            successNotification();
            const location = selectedLibrary ? selectedLibrary.name : '2nd Floor • Silent Zone';
            await createBooking(seatId, duration, location);
            showSuccess(`Booking Confirmed for Seat ${seatId}`);
            navigation.navigate('Bookings');
        } catch (err) {
            showError(err.message || 'Booking failed');
        }
    };

    const adjustDuration = (amount) => {
        selectionChanged();
        setDuration(prev => Math.max(30, Math.min(240, prev + amount)));
    };

    const handleBack = () => {
        lightImpact();
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                    <MaterialIcons name="arrow-back-ios-new" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Seat Details</Text>
                <View style={[styles.headerIconButton, { backgroundColor: colors.primaryLight }]}>
                    <MaterialIcons name="event-seat" size={24} color={colors.primary} />
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 150 }}>
                <View style={styles.heroWrapper}>
                    <View style={styles.heroCard}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRjId1zmpdQZzEQeeo37Sx_k4beEibzHTtvwYRFfyGvJzAQ3u26UGx-KFqg2EAo1nu4s_27fXLdI74J1H0JHrHGBVCwPc3YsboZuKJbRL-ZRXnzgQakRnWKN4shfqskweycZD92r1OSxlxT0oLrD3P_ThySmaD_HSbXeZgqDzPjUJJXBDybyWCbgdIbs1C-W1Bo3bEneH50cq0i0RRXASkRaXuKo-vqGJ9Nt1iw8CZi9rpzpC6l6AuAGVlNOzgaMAYU2idphXMbaqK' }}
                            style={styles.heroImage}
                        />
                        <View style={styles.ratingBadge}>
                            <MaterialIcons name="star" size={14} color="#eab308" />
                            <Text style={styles.ratingText}>4.9</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.metaSection}>
                    <View style={styles.metaHeader}>
                        <Text style={styles.seatTitle}>Seat {seatId}</Text>
                        <View style={styles.statusChip}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Available</Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <MaterialIcons name="location-on" size={16} color="#6b7280" />
                        <Text style={styles.metaSubtext}>2nd Floor • Silent Zone • East Wing</Text>
                    </View>
                </View>

                {locationStatus !== 'in_range' && (
                    <View style={[styles.warningCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }]}>
                        <MaterialIcons name="location-off" size={24} color={colors.error} />
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={[styles.warningTitle, { color: colors.text }]}>
                                {locationStatus === 'unknown' ? 'Checking Location...' : 'Outside Library Range'}
                            </Text>
                            <Text style={[styles.warningSubtitle, { color: colors.textSecondary }]}>
                                {locationStatus === 'unknown'
                                    ? 'Please wait while we verify your location.'
                                    : distanceToLibrary && selectedLibrary
                                        ? `You are ${distanceToLibrary}m away. Need to be within ${selectedLibrary.radius_meters || 100}m.`
                                        : selectedLibrary 
                                            ? `Move closer to ${selectedLibrary.name} to book.`
                                            : 'Please select a library first.'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.retryLocationButton, { backgroundColor: colors.error }]}
                            onPress={() => {
                                lightImpact();
                                refreshLocation(selectedLibrary);
                            }}
                        >
                            <MaterialIcons name="refresh" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.sectionPadding}>
                    <Text style={styles.sectionLabel}>Amenities</Text>
                    <View style={styles.amenitiesGrid}>
                        {amenities.map((item, i) => (
                            <View key={i} style={[styles.amenityCard, { backgroundColor: item.bg }]}>
                                <View style={[styles.amenityIcon, { backgroundColor: 'white' }]}>
                                    <MaterialIcons name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={styles.amenityText}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.scheduleSection}>
                    <View style={styles.scheduleHeader}>
                        <Text style={styles.sectionLabel}>Today's Schedule</Text>
                        <Text style={styles.scheduleLink}>View Calendar</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scheduleScroller}>
                        <View style={styles.scheduleItemBusy}>
                            <View style={styles.scheduleBusyBar} />
                            <Text style={styles.scheduleTime}>09:00</Text>
                        </View>
                        <View style={styles.scheduleItemBlocked}>
                            <MaterialIcons name="block" size={16} color="#ef4444" />
                            <Text style={styles.scheduleTimeMuted}>10:00</Text>
                        </View>
                        <View style={styles.scheduleItemSelected}>
                            <MaterialIcons name="check-circle" size={24} color="white" />
                            <Text style={styles.scheduleTimeActive}>11:00</Text>
                        </View>
                        {[12, 13, 14].map(h => (
                            <View key={h} style={styles.scheduleItemEmpty}>
                                <Text style={styles.scheduleTime}>{h}:00</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.rewardsCard}>
                    <View style={styles.rewardsIconWrap}>
                        <MaterialIcons name="workspace-premium" size={28} color="#3b82f6" />
                    </View>
                    <View>
                        <Text style={styles.rewardsTitle}>Earn 50 Focus Points</Text>
                        <Text style={styles.rewardsSubtitle}>Complete a 2-hour session to unlock rewards.</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.bottomRow}>
                    <View>
                        <Text style={styles.durationLabel}>Duration</Text>
                        <Text style={styles.durationValue}>{Math.floor(duration / 60)}h {duration % 60}m</Text>
                    </View>
                    <View style={styles.durationControl}>
                        <TouchableOpacity onPress={() => adjustDuration(-30)} style={styles.stepButton}>
                            <MaterialIcons name="remove" size={16} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.durationText}>{duration < 60 ? `${duration}m` : `${(duration / 60).toFixed(1)}h`}</Text>
                        <TouchableOpacity onPress={() => adjustDuration(30)} style={styles.stepButton}>
                            <MaterialIcons name="add" size={16} color="#111827" />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.bookButton, locationStatus !== 'in_range' && styles.bookButtonDisabled]}
                    onPress={handleBooking}
                    disabled={locationStatus !== 'in_range'}
                >
                    <Text style={styles.bookButtonText}>{locationStatus === 'in_range' ? 'Confirm Booking' : 'Come Closer to Book'}</Text>
                    {locationStatus === 'in_range' && <MaterialIcons name="bolt" size={20} color="white" />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    scroll: {
        flex: 1,
    },
    heroWrapper: {
        padding: 16,
    },
    heroCard: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    metaSection: {
        paddingHorizontal: 16,
        gap: 6,
    },
    metaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    seatTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#dcfce7',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    statusText: {
        color: '#166534',
        fontSize: 12,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaSubtext: {
        color: '#6b7280',
        fontSize: 14,
    },
    warningCard: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecdd3',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    warningTitle: {
        fontWeight: '700',
        color: '#b91c1c',
        marginBottom: 4,
    },
    warningSubtitle: {
        fontSize: 12,
        color: '#b91c1c',
    },
    sectionPadding: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    amenityCard: {
        width: '47%',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    amenityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    amenityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0f172a',
    },
    scheduleSection: {
        marginTop: 28,
    },
    scheduleHeader: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    scheduleLink: {
        color: '#3b82f6',
        fontWeight: '700',
        fontSize: 12,
    },
    scheduleScroller: {
        paddingHorizontal: 16,
        gap: 10,
    },
    scheduleItemBusy: {
        width: 72,
        height: 110,
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        padding: 6,
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    scheduleBusyBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(59,130,246,0.35)',
        borderRadius: 12,
    },
    scheduleItemBlocked: {
        width: 72,
        height: 110,
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecdd3',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    scheduleItemSelected: {
        width: 72,
        height: 110,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    scheduleItemEmpty: {
        width: 72,
        height: 110,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    scheduleTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 4,
    },
    scheduleTimeMuted: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9ca3af',
    },
    scheduleTimeActive: {
        fontSize: 10,
        fontWeight: '800',
        color: 'white',
    },
    rewardsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 28,
        padding: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(59,130,246,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.15)',
    },
    rewardsIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rewardsTitle: {
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    rewardsSubtitle: {
        fontSize: 12,
        color: '#475569',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 12,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    durationLabel: {
        fontSize: 11,
        letterSpacing: 1,
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontWeight: '800',
    },
    durationValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 4,
    },
    durationControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 6,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    stepButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    durationText: {
        fontWeight: '800',
        color: '#0f172a',
        width: 48,
        textAlign: 'center',
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    bookButtonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
    },
    bookButtonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
    retryLocationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SeatDetailsScreen;
