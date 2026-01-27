import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useBooking } from '../context/BookingContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BookingsScreen = () => {
    const { activeBooking, bookings, cancelBooking } = useBooking();
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Active Booking Card */}
                {activeBooking ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Active Session</Text>
                        <View style={styles.activeCard}>
                            <View style={styles.activeHeader}>
                                <View>
                                    <Text style={styles.seatTitle}>Seat {activeBooking.seatId}</Text>
                                    <Text style={styles.locationText}>{activeBooking.location}</Text>
                                </View>
                                <View style={[styles.statusBadge, activeBooking.checkedIn ? styles.checkedInBadge : styles.pendingBadge]}>
                                    <Text style={[styles.statusText, activeBooking.checkedIn ? styles.checkedInText : styles.pendingText]}>
                                        {activeBooking.checkedIn ? 'CHECKED IN' : 'PENDING'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.timerRow}>
                                <MaterialIcons name="timer" size={20} color="#3b82f6" />
                                <Text style={styles.timerText}>
                                    Ends at {activeBooking.expiresAt ? new Date(activeBooking.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </Text>
                            </View>

                            <View style={styles.buttonRow}>
                                {!activeBooking.checkedIn && (
                                    <TouchableOpacity
                                        style={styles.checkInButton}
                                        onPress={() => {
                                            if (activeBooking) {
                                                navigation.navigate('QRScan');
                                            }
                                        }}
                                    >
                                        <Text style={styles.checkInButtonText}>Check In</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.releaseButton}
                                    onPress={() => activeBooking && cancelBooking(activeBooking.id)}
                                >
                                    <Text style={styles.releaseButtonText}>Release</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No active bookings</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Map')} style={styles.findSeatLink}>
                            <Text style={styles.findSeatText}>Find a Seat</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* History */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>History</Text>
                    {bookings.length > 0 ? (
                        bookings.map((booking, index) => (
                            <View key={index} style={styles.historyItem}>
                                <View>
                                    <Text style={styles.historySeat}>Seat {booking.seatId}</Text>
                                    <Text style={styles.historyDate}>{new Date(booking.startTime).toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.historyDuration}>{booking.duration}m</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noHistory}>No past bookings found.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: 48,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#202124',
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
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    activeCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
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
        color: '#202124',
    },
    locationText: {
        color: '#64748b',
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
        color: '#475569',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    checkInButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkInButtonText: {
        color: 'white',
        fontWeight: '700',
    },
    releaseButton: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    releaseButtonText: {
        color: '#475569',
        fontWeight: '700',
    },
    emptyState: {
        padding: 32,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyText: {
        color: '#64748b',
    },
    findSeatLink: {
        marginTop: 16,
    },
    findSeatText: {
        color: '#3b82f6',
        fontWeight: '700',
    },
    historyItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: 0.7,
    },
    historySeat: {
        fontWeight: '700',
        color: '#202124',
    },
    historyDate: {
        fontSize: 12,
        color: '#64748b',
    },
    historyDuration: {
        color: '#94a3b8',
        fontWeight: '700',
    },
    noHistory: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 16,
    },
});

export default BookingsScreen;
