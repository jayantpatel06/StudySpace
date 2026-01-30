import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBooking } from '../context/BookingContext';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BookingsScreen = () => {
    const { activeBooking, bookings, cancelBooking, fetchBookingHistory, isLoading } = useBooking();
    const { colors } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // Fetch booking history on mount
    useEffect(() => {
        fetchBookingHistory();
    }, [fetchBookingHistory]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
            >
                {/* Active Booking Card */}
                {activeBooking ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Active Session</Text>
                        <View style={[styles.activeCard, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                            <View style={styles.activeHeader}>
                                <View>
                                    <Text style={[styles.seatTitle, { color: colors.text }]}>Seat {activeBooking.seatId}</Text>
                                    <Text style={[styles.locationText, { color: colors.textSecondary }]}>{activeBooking.location}</Text>
                                </View>
                                <View style={[styles.statusBadge, activeBooking.checkedIn ? styles.checkedInBadge : styles.pendingBadge]}>
                                    <Text style={[styles.statusText, activeBooking.checkedIn ? styles.checkedInText : styles.pendingText]}>
                                        {activeBooking.checkedIn ? 'CHECKED IN' : 'PENDING'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.timerRow}>
                                <MaterialIcons name="timer" size={20} color={colors.primary} />
                                <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                                    Ends at {activeBooking.expiresAt ? new Date(activeBooking.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </Text>
                            </View>

                            <View style={styles.buttonRow}>
                                {!activeBooking.checkedIn && (
                                    <TouchableOpacity
                                        style={[styles.checkInButton, { backgroundColor: colors.primary }]}
                                        onPress={() => navigation.navigate('QRScan')}
                                        accessibilityLabel="Check in by scanning QR code"
                                        accessibilityRole="button"
                                    >
                                        <MaterialIcons name="qr-code-scanner" size={18} color="white" style={{ marginRight: 6 }} />
                                        <Text style={styles.checkInButtonText}>Check In</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.releaseButton, { backgroundColor: colors.surfaceSecondary }]}
                                    onPress={() => activeBooking && cancelBooking(activeBooking.id)}
                                    accessibilityLabel="Release this seat"
                                    accessibilityRole="button"
                                >
                                    <Text style={[styles.releaseButtonText, { color: colors.textSecondary }]}>Release</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.surfaceSecondary }]}>
                        <MaterialIcons name="event-seat" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active bookings</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Map')} style={styles.findSeatLink}>
                            <Text style={[styles.findSeatText, { color: colors.primary }]}>Find a Seat</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* History */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>History</Text>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading history...</Text>
                        </View>
                    ) : bookings.length > 0 ? (
                        bookings.map((booking, index) => {
                            // Determine status display
                            const isActive = booking.status === 'active' || booking.status === 'pending' || booking.status === 'pending_checkin';
                            const isCompleted = booking.status === 'completed';
                            const isCancelled = booking.status === 'cancelled' || booking.status === 'expired';
                            
                            const getStatusIcon = () => {
                                if (isActive) return 'timer';
                                if (isCompleted) return 'check-circle';
                                return 'cancel';
                            };
                            
                            const getStatusColor = () => {
                                if (isActive) return { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' };
                                if (isCompleted) return { bg: 'rgba(34,197,94,0.1)', text: '#16a34a' };
                                return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' };
                            };
                            
                            const statusColors = getStatusColor();
                            
                            return (
                                <View key={booking.id || index} style={[styles.historyItem, { backgroundColor: colors.surface }]}>
                                    <View>
                                        <Text style={[styles.historySeat, { color: colors.text }]}>Seat {booking.seatId}</Text>
                                        <Text style={[styles.historyDate, { color: colors.textMuted }]}>{new Date(booking.startTime).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.historyRight}>
                                        <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>{booking.duration}m</Text>
                                        <View style={[
                                            styles.historyStatusBadge,
                                            { backgroundColor: statusColors.bg }
                                        ]}>
                                            <MaterialIcons name={getStatusIcon()} size={16} color={statusColors.text} />
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={[styles.noHistory, { color: colors.textMuted }]}>No past bookings found.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    activeCard: {
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    seatTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    locationText: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    checkedInBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    pendingBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    checkedInText: {
        color: '#16a34a',
    },
    pendingText: {
        color: '#ca8a04',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    timerText: {
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    checkInButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    checkInButtonText: {
        color: 'white',
        fontWeight: '700',
    },
    releaseButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    releaseButtonText: {
        fontWeight: '700',
    },
    emptyState: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyText: {
        fontSize: 16,
    },
    findSeatLink: {
        marginTop: 16,
    },
    findSeatText: {
        fontWeight: '700',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
    },
    historyItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historySeat: {
        fontWeight: '700',
    },
    historyDate: {
        fontSize: 12,
        marginTop: 2,
    },
    historyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyDuration: {
        fontWeight: '700',
    },
    historyStatusBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyStatusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    noHistory: {
        textAlign: 'center',
        marginTop: 16,
    },
});

export default BookingsScreen;
