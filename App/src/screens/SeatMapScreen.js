import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { useLocation } from '../context/LocationContext';
import { selectionChanged, lightImpact } from '../utils/haptics';
import SeatBottomSheet from '../components/SeatBottomSheet';
import { SkeletonMapGrid } from '../components/SkeletonLoader';
import { getSeatHeatmap } from '../services/api';

// Transform API data to include aisles for grid layout
const transformSeatsForGrid = (seats) => {
    if (!seats || seats.length === 0) return [];

    // Group seats by row (first character of label)
    const grouped = {};
    seats.forEach(seat => {
        const row = seat.label[0];
        if (!grouped[row]) grouped[row] = [];
        grouped[row].push(seat);
    });

    // Add aisles after position 3 in each row
    const result = [];
    Object.keys(grouped).sort().forEach((row, rowIndex) => {
        const rowSeats = grouped[row].sort((a, b) => a.label.localeCompare(b.label));
        rowSeats.forEach((seat, i) => {
            result.push(seat);
            if (i === 2) { // After 3rd seat in row
                result.push({ id: `aisle${rowIndex}a`, type: 'aisle' });
                result.push({ id: `aisle${rowIndex}b`, type: 'aisle' });
            }
        });
    });

    return result;
};

// Animated Seat Component with Pulse
const AnimatedSeat = ({ item, isSelected, onPress, colors }) => {
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        if (item.status === 'available' && !isSelected) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 200 });
        }
    }, [item.status, isSelected]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const getSeatStyle = () => {
        if (isSelected) return { backgroundColor: colors.primary };
        if (item.status === 'occupied') return { backgroundColor: colors.occupied, opacity: 0.6 };
        if (item.status === 'reserved') return { backgroundColor: colors.reserved };
        return { backgroundColor: colors.available };
    };

    const getAccessibilityLabel = () => {
        const status = item.status.charAt(0).toUpperCase() + item.status.slice(1);
        return `Seat ${item.label}, ${status}, Quiet Zone`;
    };

    const getStatusIcon = () => {
        if (item.status === 'available') return '✓';
        if (item.status === 'occupied') return '✕';
        return '○';
    };

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                onPress={onPress}
                disabled={item.status === 'occupied'}
                style={[styles.seat, getSeatStyle()]}
                accessibilityLabel={getAccessibilityLabel()}
                accessibilityHint={item.status === 'occupied'
                    ? "Seat is occupied and cannot be selected"
                    : item.status === 'reserved'
                        ? "Seat is reserved"
                        : "Double tap to select this seat"
                }
                accessibilityRole="button"
                accessibilityState={{
                    selected: isSelected,
                    disabled: item.status === 'occupied'
                }}
            >
                <Text style={styles.seatLabel}>{item.label}</Text>
                <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const SeatMapScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const { selectedLibrary } = useLibrary();
    const { locationStatus, setTargetLibrary, refreshLocation, userLocation, distanceToLibrary } = useLocation();
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [currentFloor, setCurrentFloor] = useState('Floor 1');
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [seatsData, setSeatsData] = useState([]);
    const [apiError, setApiError] = useState(null);
    const [isLive, setIsLive] = useState(false);

    // Sync selected library with location context and refresh location
    useEffect(() => {
        if (selectedLibrary) {
            // setTargetLibrary already calls refreshLocation internally
            setTargetLibrary(selectedLibrary);
        }
    }, [selectedLibrary?.id]); // Only trigger when library ID changes

    // Fetch seats from API
    const fetchSeats = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const floorNumber = parseInt(currentFloor.replace('Floor ', '')) || 1;
            const { data, error } = await getSeatHeatmap(floorNumber);

            if (error) {
                setApiError(error.message || 'Failed to load seats');
                setSeatsData([]);
            } else if (data && data.length > 0) {
                setSeatsData(transformSeatsForGrid(data));
            } else {
                setSeatsData([]);
            }
        } catch (err) {
            setApiError(err.message || 'Failed to connect to server');
            setSeatsData([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentFloor]);

    // Handle real-time seat updates
    const handleSeatUpdate = useCallback((change) => {
        const { type, seat } = change;

        if (!seat || !seat.id) return;

        setSeatsData(prev => {
            return prev.map(s => {
                if (s.id === seat.id) {
                    return { ...s, status: seat.status };
                }
                return s;
            });
        });

        // Brief flash to indicate update
        setIsLive(true);
        setTimeout(() => setIsLive(false), 1000);
    }, []);

    useEffect(() => {
        fetchSeats();
    }, [fetchSeats]);

    // Subscribe to real-time updates
    useEffect(() => {
        // Dynamic import to avoid issues if realtime service not ready
        let unsubscribe = () => { };

        import('../services/realtime').then(({ subscribeToSeats }) => {
            unsubscribe = subscribeToSeats(handleSeatUpdate);
        }).catch(err => {
            console.warn('Real-time service not available:', err);
        });

        return () => unsubscribe();
    }, [handleSeatUpdate]);



    const adjustZoom = (delta) => {
        lightImpact();
        setZoom(prev => {
            const next = Math.min(1.5, Math.max(0.8, prev + delta));
            return Number(next.toFixed(2));
        });
    };

    const handleSeatPress = (item) => {
        selectionChanged();
        setSelectedSeat(item.id);
        setShowBottomSheet(true);
    };

    const handleFloorChange = (floor) => {
        selectionChanged();
        setCurrentFloor(floor);
    };

    const handleBookNow = () => {
        lightImpact();
        setShowBottomSheet(false);
        navigation.navigate('SeatDetails', { seatId: selectedSeat });
    };

    // Memoized seat statistics
    const seatStats = useMemo(() => {
        const actualSeats = seatsData.filter(s => s.type !== 'aisle');
        return {
            available: actualSeats.filter(s => s.status === 'available').length,
            occupied: actualSeats.filter(s => s.status === 'occupied').length,
            reserved: actualSeats.filter(s => s.status === 'reserved').length,
            total: actualSeats.length,
        };
    }, [seatsData]);

    const getSelectedSeatData = () => {
        return seatsData.find(s => s.id === selectedSeat);
    };

    const renderSeat = ({ item }) => {
        if (item.type === 'aisle') {
            return <View style={styles.aisle} />;
        }

        return (
            <AnimatedSeat
                item={item}
                isSelected={selectedSeat === item.id}
                onPress={() => handleSeatPress(item)}
                colors={colors}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {selectedLibrary ? selectedLibrary.name : 'Library Seat Map'}
                </Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="info" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Library Selection Warning */}
            {!selectedLibrary && (
                <TouchableOpacity
                    style={[styles.libraryWarning, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}
                    onPress={() => navigation.navigate('LibrarySelection')}
                >
                    <MaterialIcons name="warning" size={20} color="#d97706" />
                    <Text style={styles.libraryWarningText}>
                        Please select a library first to view and book seats
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color="#d97706" />
                </TouchableOpacity>
            )}

            {/* Location Warning */}
            {selectedLibrary && locationStatus !== 'in_range' && (
                <TouchableOpacity 
                    style={[styles.locationWarning, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}
                    onPress={() => refreshLocation(selectedLibrary)}
                >
                    <MaterialIcons name="location-off" size={18} color="#dc2626" />
                    <Text style={styles.locationWarningText}>
                        You are {distanceToLibrary ? `${distanceToLibrary}m` : 'not'} from {selectedLibrary.name} (required: within {selectedLibrary.radius_meters || 100}m). Tap to refresh.
                    </Text>
                </TouchableOpacity>
            )}

            {/* Floor Selection */}
            <View style={[styles.floorSelection, { backgroundColor: colors.background }]}>
                <View style={[styles.floorTabs, { borderBottomColor: colors.border }]}>
                    {['Floor 1', 'Floor 2', 'Mezzanine'].map((floor) => (
                        <TouchableOpacity
                            key={floor}
                            onPress={() => handleFloorChange(floor)}
                            style={[styles.floorTab, currentFloor === floor && { borderBottomColor: colors.primary }]}
                        >
                            <Text style={[
                                styles.floorTabText,
                                { color: colors.textSecondary },
                                currentFloor === floor && { color: colors.primary }
                            ]}>
                                {floor}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Map Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.mapContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <View style={styles.mapHeader}>
                        <Text style={[styles.zoneLabel, { color: colors.textMuted }]}>Zone A: Quiet Study</Text>
                        <View style={[
                            styles.liveBadge,
                            { backgroundColor: isLive ? 'rgba(34, 197, 94, 0.15)' : colors.primaryLight }
                        ]}>
                            <View style={[styles.liveDot, { backgroundColor: isLive ? colors.success : colors.primary }]} />
                            <Text style={[styles.liveText, { color: isLive ? colors.success : colors.primary }]}>
                                {isLive ? 'Updating...' : 'Live View'}
                            </Text>
                        </View>
                    </View>

                    {/* Grid */}
                    {isLoading ? (
                        <SkeletonMapGrid rows={4} cols={6} />
                    ) : apiError || seatsData.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons
                                name={apiError ? "wifi-off" : "event-seat"}
                                size={48}
                                color={colors.textMuted}
                            />
                            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                                {apiError ? 'Unable to Load Seats' : 'No Seats Available'}
                            </Text>
                            <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                                {apiError || 'No seats found for this floor. Try another floor.'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                onPress={fetchSeats}
                            >
                                <MaterialIcons name="refresh" size={18} color="#fff" />
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={seatsData}
                            renderItem={renderSeat}
                            keyExtractor={item => item.id}
                            numColumns={8}
                            scrollEnabled={false}
                            contentContainerStyle={{ transform: [{ scale: zoom }], alignItems: 'stretch' }}
                        />
                    )}

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            disabled={zoom >= 1.5}
                            onPress={() => adjustZoom(0.1)}
                        >
                            <MaterialIcons name="add" size={24} color={zoom >= 1.5 ? colors.textMuted : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            disabled={zoom <= 0.8}
                            onPress={() => adjustZoom(-0.1)}
                        >
                            <MaterialIcons name="remove" size={24} color={zoom <= 0.8 ? colors.textMuted : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.zoomLabelWrapper}>
                        <Text style={[styles.zoomLabel, { color: colors.textSecondary }]}>Zoom {Math.round(zoom * 100)}%</Text>
                    </View>
                </View>
            </ScrollView>

            {/* FAB */}
            <View style={styles.fabContainer}>
                <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="qr-code-scanner" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Legend & Footer */}
            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>Availability Legend</Text>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.available }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Available ✓</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.reserved }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Reserved ○</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.occupied }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Occupied ✕</Text>
                    </View>
                </View>

                {/* Selected Seat Info (fallback if bottom sheet not showing) */}
                {selectedSeat && !showBottomSheet && (
                    <View style={[styles.selectedInfo, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
                        <View style={styles.selectedInfoLeft}>
                            <View style={[styles.seatIcon, { backgroundColor: colors.primaryLight }]}>
                                <MaterialIcons name="event-seat" size={24} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>Selected</Text>
                                <Text style={[styles.selectedSeatId, { color: colors.text }]}>Seat {selectedSeat}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.bookButton, { backgroundColor: colors.primary }]}
                            onPress={handleBookNow}
                        >
                            <Text style={styles.bookButtonText}>Book Now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Bottom Sheet */}
            <SeatBottomSheet
                seat={getSelectedSeatData()}
                visible={showBottomSheet}
                onClose={() => setShowBottomSheet(false)}
                onBookNow={handleBookNow}
            />
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
        padding: 16,
        paddingTop: 48,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: 'rgba(248, 249, 250, 0.8)',
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    floorSelection: {
        paddingHorizontal: 16,
    },
    floorTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 24,
    },
    floorTab: {
        paddingBottom: 12,
        paddingTop: 16,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    floorTabActive: {
        borderBottomColor: '#3b82f6',
    },
    floorTabText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: '#64748b',
    },
    floorTabTextActive: {
        color: '#3b82f6',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        alignItems: 'center',
    },
    mapContainer: {
        width: '100%',
        maxWidth: 384,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    mapHeader: {
        marginBottom: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    zoneLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveText: {
        fontSize: 12,
        color: '#3b82f6',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    aisle: {
        flex: 1,
        margin: 4,
        aspectRatio: 1,
    },
    seat: {
        flex: 1,
        margin: 4,
        aspectRatio: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    seatAvailable: {
        backgroundColor: '#4ade80',
    },
    seatOccupied: {
        backgroundColor: '#f87171',
    },
    seatReserved: {
        backgroundColor: '#facc15',
    },
    seatSelected: {
        backgroundColor: '#3b82f6',
    },
    seatLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'white',
    },
    statusIcon: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    controls: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        gap: 8,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    controlButtonDisabled: {
        backgroundColor: '#f8fafc',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 96,
        right: 24,
    },
    fab: {
        backgroundColor: '#3b82f6',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    footer: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: 32,
    },
    legendTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 24,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#202124',
    },
    selectedInfo: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    seatIcon: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        padding: 8,
        borderRadius: 8,
    },
    selectedLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    selectedSeatId: {
        fontWeight: '700',
        color: '#202124',
    },
    bookButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    bookButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    zoomLabelWrapper: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    zoomLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        gap: 12,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    libraryWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 10,
    },
    libraryWarningText: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
    },
    locationWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 10,
    },
    locationWarningText: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#dc2626',
        lineHeight: 16,
    },
});

export default SeatMapScreen;
