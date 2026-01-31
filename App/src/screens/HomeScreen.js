import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../context/LocationContext";
import { useBooking } from "../context/BookingContext";
import { useTheme } from "../context/ThemeContext";
import { useLibrary } from "../context/LibraryContext";
import { useFocusTimer } from "../context/FocusTimerContext";
import SkeletonLoader from "../components/SkeletonLoader";
import { lightImpact } from "../utils/haptics";

const HomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { locationStatus, setTargetLibrary } = useLocation();
  const { activeBooking, checkinTimeRemaining, breakTimeRemaining } =
    useBooking();
  const { colors, isDark } = useTheme();
  const { selectedLibrary } = useLibrary();
  const { isTimerRunning, secondsLeft, formatTime, isBreak } = useFocusTimer();
  const [isLoading, setIsLoading] = useState(true);

  // Sync selected library with location context
  useEffect(() => {
    if (selectedLibrary) {
      setTargetLibrary(selectedLibrary);
    }
  }, [selectedLibrary?.id]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (screen, params) => {
    lightImpact();
    navigation.navigate(screen, params);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <SkeletonLoader
              variant="rect"
              width="100%"
              height={70}
              style={{ borderRadius: 14, marginBottom: 24 }}
            />
            <SkeletonLoader
              variant="text"
              width="70%"
              height={24}
              style={{ marginBottom: 8 }}
            />
            <SkeletonLoader
              variant="text"
              width="50%"
              height={14}
              style={{ marginBottom: 24 }}
            />
            <SkeletonLoader
              variant="rect"
              width="100%"
              height={50}
              style={{ borderRadius: 12, marginBottom: 32 }}
            />
            <SkeletonLoader
              variant="text"
              width={120}
              height={18}
              style={{ marginBottom: 16 }}
            />
            <View style={{ flexDirection: "row", gap: 16 }}>
              <SkeletonLoader
                variant="rect"
                width="47%"
                height={110}
                style={{ borderRadius: 12 }}
              />
              <SkeletonLoader
                variant="rect"
                width="47%"
                height={110}
                style={{ borderRadius: 12 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      >
        {/* Library Selection Banner */}
        <TouchableOpacity
          style={[
            styles.libraryBanner,
            {
              backgroundColor: selectedLibrary
                ? colors.primaryLight
                : colors.surface,
              borderColor: selectedLibrary ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            lightImpact();
            navigation.navigate("LibrarySelection");
          }}
        >
          <View
            style={[
              styles.libraryBannerIcon,
              {
                backgroundColor: selectedLibrary
                  ? colors.primary
                  : colors.surfaceSecondary,
              },
            ]}
          >
            <MaterialIcons
              name="local-library"
              size={20}
              color={selectedLibrary ? "#fff" : colors.textMuted}
            />
          </View>

          <View style={styles.libraryBannerContent}>
            <Text
              style={[
                styles.libraryBannerLabel,
                { color: colors.textSecondary },
              ]}
            >
              {selectedLibrary ? "Selected Library" : "No Library Selected"}
            </Text>
            <Text style={[styles.libraryBannerName, { color: colors.text }]}>
              {selectedLibrary
                ? selectedLibrary.name
                : "Tap to select a library"}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {/* Location-based booking notice */}
        {selectedLibrary && locationStatus !== "in_range" && (
          <View
            style={[
              styles.locationNotice,
              { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
            ]}
          >
            <MaterialIcons name="location-off" size={18} color="#d97706" />
            <Text style={styles.locationNoticeText}>
              You're not within {selectedLibrary.name}'s geofence. Move closer
              to book seats.
            </Text>
          </View>
        )}

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {!activeBooking ? (
            <>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {selectedLibrary
                  ? `Welcome to ${selectedLibrary.name}`
                  : "Find your study spot"}
              </Text>
              <Text
                style={[styles.heroSubtitle, { color: colors.textSecondary }]}
              >
                {selectedLibrary
                  ? "Browse available seats and start studying"
                  : "Select a library to get started"}
              </Text>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.activeBookingCard,
                {
                  backgroundColor: colors.surface,
                  shadowColor: colors.cardShadow,
                  borderLeftColor: activeBooking.checkedIn
                    ? colors.success
                    : colors.warning,
                },
              ]}
              onPress={() => handleNavigate("Bookings")}
            >
              <View style={styles.bookingCardHeader}>
                <Text
                  style={[styles.activeBookingTitle, { color: colors.text }]}
                >
                  {activeBooking.checkedIn
                    ? "Active Session"
                    : "Pending Check-in"}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: activeBooking.checkedIn
                        ? colors.successLight
                        : "#fef3c7",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: activeBooking.checkedIn
                          ? colors.success
                          : "#d97706",
                      },
                    ]}
                  >
                    {activeBooking.isOnBreak
                      ? "On Break"
                      : activeBooking.checkedIn
                        ? "Active"
                        : "Pending"}
                  </Text>
                </View>
              </View>

              {/* Show appropriate timer */}
              {!activeBooking.checkedIn && checkinTimeRemaining !== null && (
                <View style={styles.timerRow}>
                  <MaterialIcons
                    name="timer"
                    size={20}
                    color={colors.warning}
                  />
                  <Text style={[styles.timerText, { color: colors.warning }]}>
                    {formatTime(checkinTimeRemaining)}
                  </Text>
                  <Text
                    style={[styles.timerLabel, { color: colors.textSecondary }]}
                  >
                    to check in
                  </Text>
                </View>
              )}

              {activeBooking.isOnBreak && breakTimeRemaining !== null && (
                <View style={styles.timerRow}>
                  <MaterialIcons
                    name="pause-circle-filled"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.timerText, { color: colors.primary }]}>
                    {formatTime(breakTimeRemaining)}
                  </Text>
                  <Text
                    style={[styles.timerLabel, { color: colors.textSecondary }]}
                  >
                    break remaining
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.seatInfoRow,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <View style={styles.seatInfo}>
                  <MaterialIcons
                    name="event-seat"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.seatText, { color: colors.text }]}>
                    Seat {activeBooking.seatId}
                  </Text>
                </View>
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {activeBooking.location || "Library"}
                </Text>
              </View>

              <View style={styles.viewDetailsRow}>
                <Text
                  style={[styles.viewDetailsText, { color: colors.primary }]}
                >
                  View Details
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Browse Seats Card */}
        {selectedLibrary && !activeBooking && (
          <TouchableOpacity
            style={[
              styles.browseSeatsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                shadowColor: colors.cardShadow,
              },
            ]}
            onPress={() => handleNavigate("Map")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.browseSeatsIconContainer,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <MaterialIcons
                name="grid-view"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.browseSeatsContent}>
              <Text style={[styles.browseSeatsTitle, { color: colors.text }]}>
                Browse Available Seats
              </Text>
              <Text
                style={[
                  styles.browseSeatsSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                View seat map and book your spot
              </Text>
            </View>
            <View
              style={[
                styles.browseSeatsArrow,
                { backgroundColor: colors.primary },
              ]}
            >
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Active Focus Timer Banner */}
        {isTimerRunning && (
          <TouchableOpacity
            style={[
              styles.focusTimerBanner,
              {
                backgroundColor: isBreak
                  ? colors.successLight
                  : colors.primaryLight,
                borderColor: isBreak ? colors.success : colors.primary,
              },
            ]}
            onPress={() => handleNavigate("FocusTimer")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.focusTimerPulse,
                { backgroundColor: isBreak ? colors.success : colors.primary },
              ]}
            />
            <MaterialIcons
              name={isBreak ? "local-cafe" : "timer"}
              size={22}
              color={isBreak ? colors.success : colors.primary}
            />
            <View style={styles.focusTimerContent}>
              <Text
                style={[
                  styles.focusTimerLabel,
                  { color: isBreak ? colors.success : colors.primary },
                ]}
              >
                {isBreak ? "Break Time" : "Focus Session Active"}
              </Text>
              <Text style={[styles.focusTimerTime, { color: colors.text }]}>
                {formatTime(secondsLeft)} remaining
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isBreak ? colors.success : colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  shadowColor: colors.cardShadow,
                },
              ]}
              onPress={() => handleNavigate("FocusTimer")}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <MaterialIcons name="timer" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Focus Room
              </Text>
              <Text
                style={[styles.actionSubtitle, { color: colors.textSecondary }]}
              >
                Start session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  shadowColor: colors.cardShadow,
                },
              ]}
              onPress={() => handleNavigate("Rewards")}
            >
              <View
                style={[
                  styles.actionIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(168, 85, 247, 0.15)"
                      : "#faf5ff",
                  },
                ]}
              >
                <MaterialIcons name="emoji-events" size={24} color="#a855f7" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Rewards
              </Text>
              <Text
                style={[styles.actionSubtitle, { color: colors.textSecondary }]}
              >
                View progress
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Quick Action FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => handleNavigate("QRScan")}
      >
        <MaterialIcons name="qr-code-scanner" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    fontWeight: "700",
    color: "#202124",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  activeBookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activeBookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202124",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  timerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b82f6",
  },
  timerLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  seatInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  seatInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seatText: {
    fontWeight: "600",
    color: "#202124",
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "600",
  },
  browseSeatsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  browseSeatsIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  browseSeatsContent: {
    flex: 1,
  },
  browseSeatsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  browseSeatsSubtitle: {
    fontSize: 13,
  },
  browseSeatsArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202124",
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 16,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontWeight: "700",
    color: "#202124",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  libraryBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  libraryBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  libraryBannerContent: {
    flex: 1,
  },
  libraryBannerLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  libraryBannerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  locationNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  locationNoticeText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 16,
  },
  focusTimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  focusTimerPulse: {
    position: "absolute",
    left: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  focusTimerContent: {
    flex: 1,
    marginLeft: 4,
  },
  focusTimerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  focusTimerTime: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default HomeScreen;
