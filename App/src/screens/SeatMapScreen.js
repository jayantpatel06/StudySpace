import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useLibrary } from "../context/LibraryContext";
import { useLocation } from "../context/LocationContext";
import { selectionChanged, lightImpact } from "../utils/haptics";
import SeatBottomSheet from "../components/SeatBottomSheet";
import { SkeletonMapGrid } from "../components/SkeletonLoader";
import {
  getSeatHeatmap,
  getLibraryFloors,
  getLibrarySeatHeatmap,
} from "../services/api";

// Transform API data - group by rows for proper grid display
const transformSeatsForGrid = (seats) => {
  if (!seats || seats.length === 0) return { rows: [], allSeats: [] };

  // Group seats by row (first character of label)
  const grouped = {};
  seats.forEach((seat) => {
    const row = seat.label[0];
    if (!grouped[row]) grouped[row] = [];
    grouped[row].push(seat);
  });

  // Sort each row's seats by number
  const rows = Object.keys(grouped)
    .sort()
    .map((rowKey) => {
      return grouped[rowKey].sort((a, b) => {
        const numA = parseInt(a.label.slice(1)) || 0;
        const numB = parseInt(b.label.slice(1)) || 0;
        return numA - numB;
      });
    });

  return { rows, allSeats: seats };
};

// Animated Seat Component with Pulse
const AnimatedSeat = ({ item, isSelected, onPress, colors }) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (item.status === "available" && !isSelected) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
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
    if (item.status === "occupied")
      return { backgroundColor: colors.occupied, opacity: 0.6 };
    if (item.status === "reserved") return { backgroundColor: colors.reserved };
    return { backgroundColor: colors.available };
  };

  const getAccessibilityLabel = () => {
    const status = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    return `Seat ${item.label}, ${status}, Quiet Zone`;
  };

  const getStatusIcon = () => {
    if (item.status === "available") return "✓";
    if (item.status === "occupied") return "✕";
    return "○";
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={item.status === "occupied"}
        style={[styles.seat, getSeatStyle()]}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={
          item.status === "occupied"
            ? "Seat is occupied and cannot be selected"
            : item.status === "reserved"
              ? "Seat is reserved"
              : "Double tap to select this seat"
        }
        accessibilityRole="button"
        accessibilityState={{
          selected: isSelected,
          disabled: item.status === "occupied",
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
  const {
    locationStatus,
    setTargetLibrary,
    refreshLocation,
    userLocation,
    distanceToLibrary,
  } = useLocation();
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [floors, setFloors] = useState([]);
  const [currentFloor, setCurrentFloor] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [floorsLoading, setFloorsLoading] = useState(true);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [seatsData, setSeatsData] = useState({ rows: [], allSeats: [] });
  const [apiError, setApiError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Fetch floors for selected library
  useEffect(() => {
    const fetchFloors = async () => {
      if (!selectedLibrary?.id) {
        setFloors([]);
        setFloorsLoading(false);
        return;
      }

      setFloorsLoading(true);
      try {
        const { data, error } = await getLibraryFloors(selectedLibrary.id);
        if (error) {
          console.error("Error fetching floors:", error);
          setFloors([]);
        } else if (data && data.length > 0) {
          setFloors(data);
          // Select first floor by default
          if (!currentFloor) {
            setCurrentFloor(data[0]);
          }
        } else {
          // Fallback to default floors if none defined
          setFloors([
            { id: "default-1", floor_number: 1, floor_name: "Floor 1" },
            { id: "default-2", floor_number: 2, floor_name: "Floor 2" },
          ]);
          if (!currentFloor) {
            setCurrentFloor({
              id: "default-1",
              floor_number: 1,
              floor_name: "Floor 1",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching floors:", err);
        setFloors([]);
      } finally {
        setFloorsLoading(false);
      }
    };

    fetchFloors();
  }, [selectedLibrary?.id]);

  // Sync selected library with location context and refresh location
  useEffect(() => {
    if (selectedLibrary) {
      // setTargetLibrary already calls refreshLocation internally
      setTargetLibrary(selectedLibrary);
    }
  }, [selectedLibrary?.id]); // Only trigger when library ID changes

  // Fetch seats from API
  const fetchSeats = useCallback(async () => {
    if (!currentFloor) return;

    setIsLoading(true);
    setApiError(null);

    try {
      let data, error;

      // Use library-specific seat fetch if we have a library selected
      // Check if it's a real floor (numeric id) vs fallback (string id starting with 'default-')
      const isRealFloor =
        currentFloor?.id && typeof currentFloor.id === "number";

      if (selectedLibrary?.id && isRealFloor) {
        ({ data, error } = await getLibrarySeatHeatmap(
          selectedLibrary.id,
          currentFloor.id,
        ));
      } else {
        // Fallback to floor-based fetch
        const floorNumber = currentFloor?.floor_number || 1;
        ({ data, error } = await getSeatHeatmap(floorNumber));
      }

      if (error) {
        setApiError(error.message || "Failed to load seats");
        setSeatsData({ rows: [], allSeats: [] });
      } else if (data && data.length > 0) {
        setSeatsData(transformSeatsForGrid(data));
      } else {
        setSeatsData({ rows: [], allSeats: [] });
      }
    } catch (err) {
      setApiError(err.message || "Failed to connect to server");
      setSeatsData({ rows: [], allSeats: [] });
    } finally {
      setIsLoading(false);
    }
  }, [currentFloor, selectedLibrary?.id]);

  // Handle real-time seat updates
  const handleSeatUpdate = useCallback((change) => {
    const { type, seat } = change;

    if (!seat || !seat.id) return;

    setSeatsData((prev) => {
      const newRows = prev.rows.map((row) =>
        row.map((s) => (s.id === seat.id ? { ...s, status: seat.status } : s)),
      );
      const newAllSeats = prev.allSeats.map((s) =>
        s.id === seat.id ? { ...s, status: seat.status } : s,
      );
      return { rows: newRows, allSeats: newAllSeats };
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
    let unsubscribe = () => {};

    import("../services/realtime")
      .then(({ subscribeToSeats }) => {
        unsubscribe = subscribeToSeats(handleSeatUpdate);
      })
      .catch((err) => {
        console.warn("Real-time service not available:", err);
      });

    return () => unsubscribe();
  }, [handleSeatUpdate]);

  const adjustZoom = (delta) => {
    lightImpact();
    setZoom((prev) => {
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
    navigation.navigate("SeatDetails", { seatId: selectedSeat });
  };

  // Memoized seat statistics
  const seatStats = useMemo(() => {
    const allSeats = seatsData.allSeats || [];
    return {
      available: allSeats.filter((s) => s.status === "available").length,
      occupied: allSeats.filter((s) => s.status === "occupied").length,
      reserved: allSeats.filter((s) => s.status === "reserved").length,
      total: allSeats.length,
    };
  }, [seatsData]);

  const getSelectedSeatData = () => {
    return seatsData.allSeats?.find((s) => s.id === selectedSeat);
  };

  // Render a single seat
  const renderSeat = (seat) => (
    <AnimatedSeat
      key={seat.id}
      item={seat}
      isSelected={selectedSeat === seat.id}
      onPress={() => handleSeatPress(seat)}
      colors={colors}
    />
  );

  // Render a row of seats
  const renderRow = (rowSeats, rowIndex) => (
    <View key={`row-${rowIndex}`} style={styles.seatRow}>
      {rowSeats.map((seat) => renderSeat(seat))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <MaterialIcons
            name="arrow-back-ios-new"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {selectedLibrary ? selectedLibrary.name : "Library Seat Map"}
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="info" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Library Selection Warning */}
      {!selectedLibrary && (
        <TouchableOpacity
          style={[
            styles.libraryWarning,
            { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
          ]}
          onPress={() => navigation.navigate("LibrarySelection")}
        >
          <MaterialIcons name="warning" size={20} color="#d97706" />
          <Text style={styles.libraryWarningText}>
            Please select a library first to view and book seats
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#d97706" />
        </TouchableOpacity>
      )}

      {/* Location Warning */}
      {selectedLibrary && locationStatus !== "in_range" && (
        <TouchableOpacity
          style={[
            styles.locationWarning,
            { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
          ]}
          onPress={() => refreshLocation(selectedLibrary)}
        >
          <MaterialIcons name="location-off" size={18} color="#dc2626" />
          <Text style={styles.locationWarningText}>
            You are {distanceToLibrary ? `${distanceToLibrary}m` : "not"} from{" "}
            {selectedLibrary.name} (required: within{" "}
            {selectedLibrary.radius_meters || 100}m). Tap to refresh.
          </Text>
        </TouchableOpacity>
      )}

      {/* Floor Selection */}
      <View
        style={[styles.floorSelection, { backgroundColor: colors.background }]}
      >
        {floorsLoading ? (
          <View style={styles.floorTabsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[
                styles.floorTabsLoadingText,
                { color: colors.textSecondary },
              ]}
            >
              Loading floors...
            </Text>
          </View>
        ) : floors.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.floorTabsScroll}
          >
            <View
              style={[styles.floorTabs, { borderBottomColor: colors.border }]}
            >
              {floors.map((floor) => (
                <TouchableOpacity
                  key={floor.id}
                  onPress={() => handleFloorChange(floor)}
                  style={[
                    styles.floorTab,
                    currentFloor?.id === floor.id && {
                      borderBottomColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.floorTabText,
                      { color: colors.textSecondary },
                      currentFloor?.id === floor.id && {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {floor.floor_name || `Floor ${floor.floor_number}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.noFloorsMessage}>
            <Text
              style={[styles.noFloorsText, { color: colors.textSecondary }]}
            >
              No floors configured
            </Text>
          </View>
        )}
      </View>

      {/* Map Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.mapContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.mapHeader}>
            <Text style={[styles.zoneLabel, { color: colors.textMuted }]}>
              {seatStats.total > 0
                ? `${seatStats.available} of ${seatStats.total} Available`
                : "Seat Map"}
            </Text>
            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: isLive
                    ? "rgba(34, 197, 94, 0.15)"
                    : colors.primaryLight,
                },
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: isLive ? colors.success : colors.primary },
                ]}
              />
              <Text
                style={[
                  styles.liveText,
                  { color: isLive ? colors.success : colors.primary },
                ]}
              >
                {isLive ? "Updating..." : "Live View"}
              </Text>
            </View>
          </View>

          {/* Grid */}
          {isLoading ? (
            <SkeletonMapGrid rows={4} cols={6} />
          ) : apiError || seatsData.rows.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name={apiError ? "wifi-off" : "event-seat"}
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {apiError ? "Unable to Load Seats" : "No Seats Available"}
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {apiError ||
                  "No seats found for this floor. Try another floor."}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={fetchSeats}
              >
                <MaterialIcons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gridScrollContainer}
            >
              <View style={[styles.seatGrid, { transform: [{ scale: zoom }] }]}>
                {seatsData.rows.map((row, index) => renderRow(row, index))}
              </View>
            </ScrollView>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              disabled={zoom >= 1.5}
              onPress={() => adjustZoom(0.1)}
            >
              <MaterialIcons
                name="add"
                size={24}
                color={zoom >= 1.5 ? colors.textMuted : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              disabled={zoom <= 0.8}
              onPress={() => adjustZoom(-0.1)}
            >
              <MaterialIcons
                name="remove"
                size={24}
                color={zoom <= 0.8 ? colors.textMuted : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.zoomLabelWrapper}>
            <Text style={[styles.zoomLabel, { color: colors.textSecondary }]}>
              Zoom {Math.round(zoom * 100)}%
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Legend & Footer */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>
          Availability Legend
        </Text>
        <View style={styles.legendRow}>
          <View
            style={[
              styles.legendItem,
              { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" },
            ]}
          >
            <View
              style={[styles.legendDot, { backgroundColor: colors.available }]}
            />
            <Text style={[styles.legendText, { color: colors.text }]}>
              Available
            </Text>
          </View>
          <View
            style={[
              styles.legendItem,
              { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" },
            ]}
          >
            <View
              style={[styles.legendDot, { backgroundColor: colors.reserved }]}
            />
            <Text style={[styles.legendText, { color: colors.text }]}>
              Reserved
            </Text>
          </View>
          <View
            style={[
              styles.legendItem,
              { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" },
            ]}
          >
            <View
              style={[styles.legendDot, { backgroundColor: colors.occupied }]}
            />
            <Text style={[styles.legendText, { color: colors.text }]}>
              Occupied
            </Text>
          </View>
        </View>

        {/* Selected Seat Info (fallback if bottom sheet not showing) */}
        {selectedSeat && !showBottomSheet && (
          <View
            style={[
              styles.selectedInfo,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.selectedInfoLeft}>
              <View
                style={[
                  styles.seatIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <MaterialIcons
                  name="event-seat"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.selectedLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Selected
                </Text>
                <Text style={[styles.selectedSeatId, { color: colors.text }]}>
                  Seat {selectedSeat}
                </Text>
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 48,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "rgba(248, 249, 250, 0.8)",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  floorSelection: {
    paddingHorizontal: 16,
  },
  floorTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 24,
  },
  floorTab: {
    paddingBottom: 12,
    paddingTop: 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  floorTabActive: {
    borderBottomColor: "#3b82f6",
  },
  floorTabText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#64748b",
  },
  floorTabTextActive: {
    color: "#3b82f6",
  },
  floorTabsScroll: {
    flexGrow: 0,
  },
  floorTabsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  floorTabsLoadingText: {
    fontSize: 14,
  },
  noFloorsMessage: {
    paddingVertical: 16,
    alignItems: "center",
  },
  noFloorsText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  mapContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 16,
    paddingBottom: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mapHeader: {
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 12,
    color: "#3b82f6",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  aisle: {
    width: 16,
    margin: 3,
  },
  emptySeat: {
    width: 48,
    height: 48,
    margin: 5,
  },
  gridScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  seatGrid: {
    alignItems: "center",
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 6,
  },
  seat: {
    width: 48,
    height: 48,
    margin: 5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  seatAvailable: {
    backgroundColor: "#4ade80",
  },
  seatOccupied: {
    backgroundColor: "#f87171",
  },
  seatReserved: {
    backgroundColor: "#facc15",
  },
  seatSelected: {
    backgroundColor: "#3b82f6",
  },
  seatLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusIcon: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  controls: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  controlButtonDisabled: {
    backgroundColor: "#f8fafc",
  },
  fabContainer: {
    position: "absolute",
    bottom: 180, // Above footer and tab bar
    right: 20,
  },
  fab: {
    backgroundColor: "#3b82f6",
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  footer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100, // Account for tab bar
  },
  legendTitle: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#202124",
  },
  selectedInfo: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seatIcon: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  selectedLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  selectedSeatId: {
    fontWeight: "700",
    color: "#202124",
  },
  bookButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  zoomLabelWrapper: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  zoomLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  libraryWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  libraryWarningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  locationWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  locationWarningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#dc2626",
    lineHeight: 16,
  },
});

export default SeatMapScreen;
