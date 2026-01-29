import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../context/ThemeContext";
import { lightImpact } from "../utils/haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = 280;

/**
 * SeatBottomSheet - Slide-up panel for seat quick-view
 * @param {object} props
 * @param {object} props.seat - Seat data { id, status, label, has_power, is_quiet_zone, has_lamp, has_ergo_chair, has_wifi, wifi_speed, zone, room }
 * @param {boolean} props.visible - Whether sheet is visible
 * @param {function} props.onClose - Close handler
 * @param {function} props.onBookNow - Book now handler
 */

// Amenity configuration for dynamic display
const AMENITY_CONFIG = {
  has_power: { icon: "power", label: "Power" },
  has_lamp: { icon: "lightbulb", label: "Lamp" },
  has_ergo_chair: { icon: "chair-alt", label: "Ergo Chair" },
  has_wifi: { icon: "wifi", label: "WiFi" },
  is_quiet_zone: { icon: "volume-off", label: "Quiet Zone" },
};

const WIFI_SPEED_LABELS = {
  basic: "Basic",
  standard: "Standard",
  "high-speed": "High-Speed",
  gigabit: "Gigabit",
};

const SeatBottomSheet = ({ seat, visible, onClose, onBookNow }) => {
  const { colors, isDark } = useTheme();
  const translateY = useSharedValue(SHEET_HEIGHT);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20 });
      lightImpact();
    } else {
      translateY.value = withSpring(SHEET_HEIGHT, { damping: 20 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        translateY.value = withSpring(SHEET_HEIGHT, { damping: 20 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  if (!seat) return null;

  const getStatusColor = () => {
    switch (seat.status) {
      case "available":
        return colors.available;
      case "reserved":
        return colors.reserved;
      case "occupied":
        return colors.occupied;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = () => {
    switch (seat.status) {
      case "available":
        return "Available";
      case "reserved":
        return "Reserved";
      case "occupied":
        return "Occupied";
      default:
        return "Unknown";
    }
  };

  // Build amenities array from seat data
  const getAmenities = () => {
    const amenities = [];
    Object.keys(AMENITY_CONFIG).forEach((key) => {
      if (seat[key]) {
        const config = { ...AMENITY_CONFIG[key] };
        // Special handling for WiFi to show speed
        if (key === "has_wifi" && seat.wifi_speed) {
          config.label = WIFI_SPEED_LABELS[seat.wifi_speed] || "WiFi";
        }
        amenities.push(config);
      }
    });
    return amenities;
  };

  // Get location string from seat data
  const getLocationString = () => {
    const parts = [];
    if (seat.room?.floor?.floor_name) {
      parts.push(seat.room.floor.floor_name);
    } else if (seat.floor) {
      parts.push(`Floor ${seat.floor}`);
    }
    if (seat.room?.room_name) {
      parts.push(seat.room.room_name);
    } else if (seat.zone && seat.zone !== "General") {
      parts.push(seat.zone);
    }
    return parts.length > 0 ? parts.join(" • ") : "Study Area";
  };

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface },
            animatedStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
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
                  <Text style={[styles.seatId, { color: colors.text }]}>
                    Seat {seat.label || seat.id}
                  </Text>
                  <Text
                    style={[styles.location, { color: colors.textSecondary }]}
                  >
                    {getLocationString()}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor() + "20" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor() },
                  ]}
                />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusLabel()}
                </Text>
              </View>
            </View>

            {/* Amenities */}
            {getAmenities().length > 0 && (
              <View style={styles.amenities}>
                {getAmenities().map((amenity, index) => (
                  <View
                    key={index}
                    style={[
                      styles.amenityChip,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <MaterialIcons
                      name={amenity.icon}
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.amenityText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {amenity.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bookButton,
                  {
                    backgroundColor:
                      seat.status === "available"
                        ? colors.primary
                        : colors.textMuted,
                  },
                ]}
                onPress={onBookNow}
                disabled={seat.status !== "available"}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
                <MaterialIcons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  seatId: {
    fontSize: 18,
    fontWeight: "700",
  },
  location: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  amenities: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "700",
  },
  bookButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default SeatBottomSheet;
