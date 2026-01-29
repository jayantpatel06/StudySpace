import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import {
  getFloorsByLibrary,
  getRoomsByFloor,
  getSeatsByRoom,
} from "../../services/adminApi";
import { lightImpact } from "../../utils/haptics";

const AdminManageSeatsScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { library } = route.params;

  const [floors, setFloors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFloor, setExpandedFloor] = useState(null);
  const [roomsData, setRoomsData] = useState({});
  const [seatsData, setSeatsData] = useState({});

  const fetchFloors = useCallback(async () => {
    try {
      const { data, error } = await getFloorsByLibrary(library.id);
      if (!error) {
        setFloors(data || []);
      }
    } catch (error) {
      console.error("Error fetching floors:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [library.id]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  const fetchRooms = async (floorId) => {
    try {
      const { data, error } = await getRoomsByFloor(floorId);
      if (!error) {
        setRoomsData((prev) => ({ ...prev, [floorId]: data || [] }));
        // Fetch seats for each room
        for (const room of data || []) {
          fetchSeats(room.id);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchSeats = async (roomId) => {
    try {
      const { data, error } = await getSeatsByRoom(roomId);
      if (!error) {
        setSeatsData((prev) => ({ ...prev, [roomId]: data || [] }));
      }
    } catch (error) {
      console.error("Error fetching seats:", error);
    }
  };

  const toggleFloorExpand = (floorId) => {
    lightImpact();
    if (expandedFloor === floorId) {
      setExpandedFloor(null);
    } else {
      setExpandedFloor(floorId);
      if (!roomsData[floorId]) {
        fetchRooms(floorId);
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRoomsData({});
    setSeatsData({});
    setExpandedFloor(null);
    fetchFloors();
  }, [fetchFloors]);

  // Get seat count for a room
  const getSeatCount = (roomId) => {
    const seats = seatsData[roomId] || [];
    return {
      total: seats.length,
      available: seats.filter((s) => s.status === "available").length,
      occupied: seats.filter((s) => s.status === "occupied").length,
      reserved: seats.filter((s) => s.status === "reserved").length,
    };
  };

  // Get total stats for a floor
  const getFloorStats = (floorId) => {
    const rooms = roomsData[floorId] || [];
    let totalSeats = 0;
    let availableSeats = 0;

    rooms.forEach((room) => {
      const stats = getSeatCount(room.id);
      totalSeats += stats.total;
      availableSeats += stats.available;
    });

    return { rooms: rooms.length, totalSeats, availableSeats };
  };

  // Calculate library totals
  const getLibraryTotals = () => {
    let totalFloors = floors.length;
    let totalRooms = 0;
    let totalSeats = 0;
    let availableSeats = 0;

    floors.forEach((floor) => {
      const rooms = roomsData[floor.id] || [];
      totalRooms += rooms.length;
      rooms.forEach((room) => {
        const stats = getSeatCount(room.id);
        totalSeats += stats.total;
        availableSeats += stats.available;
      });
    });

    return { totalFloors, totalRooms, totalSeats, availableSeats };
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const libraryTotals = getLibraryTotals();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Library Structure
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {library.name}
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Info Banner */}
      <View
        style={[styles.infoBanner, { backgroundColor: colors.primaryLight }]}
      >
        <MaterialIcons name="info" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          Structure is managed by the library owner via their dashboard
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons name="layers" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {libraryTotals.totalFloors}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Floors
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons name="meeting-room" size={24} color="#2563eb" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {libraryTotals.totalRooms}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Rooms
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons name="event-seat" size={24} color="#16a34a" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {libraryTotals.totalSeats}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Seats
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {floors.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="layers" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Structure Configured
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              The library owner can set up floors, rooms, and seats through
              their dashboard.
            </Text>
          </View>
        ) : (
          floors.map((floor) => {
            const isExpanded = expandedFloor === floor.id;
            const floorStats = getFloorStats(floor.id);
            const rooms = roomsData[floor.id] || [];

            return (
              <View
                key={floor.id}
                style={[
                  styles.floorCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Floor Header */}
                <TouchableOpacity
                  style={styles.floorHeader}
                  onPress={() => toggleFloorExpand(floor.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.floorIcon,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <MaterialIcons
                      name="layers"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.floorInfo}>
                    <Text style={[styles.floorTitle, { color: colors.text }]}>
                      Floor {floor.floor_number}
                      {floor.floor_name ? ` - ${floor.floor_name}` : ""}
                    </Text>
                    <Text
                      style={[
                        styles.floorStats,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {floorStats.rooms} rooms • {floorStats.totalSeats} seats
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isExpanded ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Expanded Rooms */}
                {isExpanded && (
                  <View style={styles.roomsContainer}>
                    {rooms.length === 0 ? (
                      <View style={styles.noRooms}>
                        <Text
                          style={[
                            styles.noRoomsText,
                            { color: colors.textMuted },
                          ]}
                        >
                          No rooms configured on this floor
                        </Text>
                      </View>
                    ) : (
                      rooms.map((room) => {
                        const seatStats = getSeatCount(room.id);
                        return (
                          <View
                            key={room.id}
                            style={[
                              styles.roomCard,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <View style={styles.roomInfo}>
                              <View style={styles.roomHeader}>
                                <MaterialIcons
                                  name="meeting-room"
                                  size={20}
                                  color={colors.primary}
                                />
                                <Text
                                  style={[
                                    styles.roomName,
                                    { color: colors.text },
                                  ]}
                                >
                                  {room.room_name}
                                </Text>
                                {room.room_code && (
                                  <View
                                    style={[
                                      styles.roomCodeBadge,
                                      { backgroundColor: colors.primaryLight },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.roomCode,
                                        { color: colors.primary },
                                      ]}
                                    >
                                      {room.room_code}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.roomMeta}>
                                <View
                                  style={[
                                    styles.typeBadge,
                                    { backgroundColor: "#dbeafe" },
                                  ]}
                                >
                                  <Text style={styles.typeText}>
                                    {room.room_type || "Study Hall"}
                                  </Text>
                                </View>
                              </View>

                              {/* Seat Stats */}
                              <View style={styles.seatStats}>
                                <View style={styles.seatStatItem}>
                                  <MaterialIcons
                                    name="event-seat"
                                    size={16}
                                    color={colors.textMuted}
                                  />
                                  <Text
                                    style={[
                                      styles.seatStatText,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    {seatStats.total} total
                                  </Text>
                                </View>
                                <View style={styles.seatStatItem}>
                                  <View
                                    style={[
                                      styles.statusDot,
                                      { backgroundColor: "#22c55e" },
                                    ]}
                                  />
                                  <Text
                                    style={[
                                      styles.seatStatText,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    {seatStats.available} available
                                  </Text>
                                </View>
                                <View style={styles.seatStatItem}>
                                  <View
                                    style={[
                                      styles.statusDot,
                                      { backgroundColor: "#ef4444" },
                                    ]}
                                  />
                                  <Text
                                    style={[
                                      styles.seatStatText,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    {seatStats.occupied} occupied
                                  </Text>
                                </View>
                                {seatStats.reserved > 0 && (
                                  <View style={styles.seatStatItem}>
                                    <View
                                      style={[
                                        styles.statusDot,
                                        { backgroundColor: "#f59e0b" },
                                      ]}
                                    />
                                    <Text
                                      style={[
                                        styles.seatStatText,
                                        { color: colors.textSecondary },
                                      ]}
                                    >
                                      {seatStats.reserved} reserved
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 44,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statValue: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 24,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  floorCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  floorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  floorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  floorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  floorTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
  },
  floorStats: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  roomsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
  },
  noRooms: {
    padding: 24,
    alignItems: "center",
  },
  noRoomsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  roomCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  roomCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomCode: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  roomMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#2563eb",
  },
  seatStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  seatStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seatStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AdminManageSeatsScreen;
