import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBooking } from "../context/BookingContext";
import { useLocation } from "../context/LocationContext";
import { useTheme } from "../context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";

const BookingsScreen = () => {
  const {
    activeBooking,
    bookings,
    cancelBooking,
    fetchBookingHistory,
    fetchActiveBooking,
    isLoading,
    checkinTimeRemaining,
    breakTimeRemaining,
    startBreak,
    endBreak,
    checkBreakExpiry,
  } = useBooking();
  const { locationStatus } = useLocation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakDuration, setBreakDuration] = useState(15); // default 15 min
  const [isStartingBreak, setIsStartingBreak] = useState(false);

  // Fetch booking data on focus - empty dependency array to only run on mount/focus
  useFocusEffect(
    useCallback(() => {
      fetchActiveBooking();
      fetchBookingHistory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Check break expiry when break timer ends
  useEffect(() => {
    if (breakTimeRemaining === 0 && activeBooking?.isOnBreak) {
      const isInRange = locationStatus === "in_range";
      checkBreakExpiry(isInRange);
    }
  }, [
    breakTimeRemaining,
    activeBooking?.isOnBreak,
    locationStatus,
    checkBreakExpiry,
  ]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle starting a break
  const handleStartBreak = async () => {
    setIsStartingBreak(true);
    await startBreak(breakDuration);
    setIsStartingBreak(false);
    setShowBreakModal(false);
  };

  // Handle ending break early
  const handleEndBreak = async () => {
    await endBreak();
  };

  // Determine if check-in timer is urgent (less than 5 min)
  const isCheckinUrgent =
    checkinTimeRemaining !== null && checkinTimeRemaining < 300;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Bookings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      >
        {/* Active Booking Card */}
        {activeBooking ? (
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Active Session
            </Text>
            <View
              style={[
                styles.activeCard,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              <View style={styles.activeHeader}>
                <View>
                  <Text style={[styles.seatTitle, { color: colors.text }]}>
                    Seat {activeBooking.seatId}
                  </Text>
                  <Text
                    style={[
                      styles.locationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {activeBooking.location}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    activeBooking.isOnBreak
                      ? styles.breakBadge
                      : activeBooking.checkedIn
                        ? styles.checkedInBadge
                        : styles.pendingBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      activeBooking.isOnBreak
                        ? styles.breakText
                        : activeBooking.checkedIn
                          ? styles.checkedInText
                          : styles.pendingText,
                    ]}
                  >
                    {activeBooking.isOnBreak
                      ? "ON BREAK"
                      : activeBooking.checkedIn
                        ? "CHECKED IN"
                        : "PENDING"}
                  </Text>
                </View>
              </View>

              {/* Check-in Timer (only show if not checked in) */}
              {!activeBooking.checkedIn && checkinTimeRemaining !== null && (
                <View
                  style={[
                    styles.checkinTimerCard,
                    {
                      backgroundColor: isCheckinUrgent
                        ? isDark
                          ? "rgba(239,68,68,0.15)"
                          : "#fef2f2"
                        : isDark
                          ? "rgba(59,130,246,0.15)"
                          : "#eff6ff",
                    },
                  ]}
                >
                  <MaterialIcons
                    name="access-time"
                    size={24}
                    color={isCheckinUrgent ? "#ef4444" : colors.primary}
                  />
                  <View style={styles.checkinTimerContent}>
                    <Text
                      style={[
                        styles.checkinTimerLabel,
                        { color: isCheckinUrgent ? "#ef4444" : colors.primary },
                      ]}
                    >
                      Check-in within
                    </Text>
                    <Text
                      style={[
                        styles.checkinTimerValue,
                        { color: isCheckinUrgent ? "#ef4444" : colors.text },
                      ]}
                    >
                      {formatTime(checkinTimeRemaining)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.showQRButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setShowQRModal(true)}
                  >
                    <MaterialIcons name="qr-code" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Break Timer (only show if on break) */}
              {activeBooking.isOnBreak && breakTimeRemaining !== null && (
                <View
                  style={[
                    styles.breakTimerCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(168,85,247,0.15)"
                        : "#faf5ff",
                    },
                  ]}
                >
                  <MaterialIcons name="coffee" size={24} color="#a855f7" />
                  <View style={styles.breakTimerContent}>
                    <Text
                      style={[styles.breakTimerLabel, { color: "#a855f7" }]}
                    >
                      Break ends in
                    </Text>
                    <Text
                      style={[styles.breakTimerValue, { color: colors.text }]}
                    >
                      {formatTime(breakTimeRemaining)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.endBreakButton,
                      { backgroundColor: "#a855f7" },
                    ]}
                    onPress={handleEndBreak}
                  >
                    <Text style={styles.endBreakButtonText}>End Break</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Session end timer */}
              <View style={styles.timerRow}>
                <MaterialIcons name="timer" size={20} color={colors.primary} />
                <Text
                  style={[styles.timerText, { color: colors.textSecondary }]}
                >
                  Session ends at{" "}
                  {activeBooking.expiresAt
                    ? new Date(activeBooking.expiresAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                {!activeBooking.checkedIn ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.checkInButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setShowQRModal(true)}
                      accessibilityLabel="Show QR code for check-in"
                      accessibilityRole="button"
                    >
                      <MaterialIcons
                        name="qr-code"
                        size={18}
                        color="white"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.checkInButtonText}>Show QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.releaseButton,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                      onPress={() =>
                        activeBooking && cancelBooking(activeBooking.id)
                      }
                      accessibilityLabel="Cancel booking"
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.releaseButtonText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : !activeBooking.isOnBreak ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.breakButton,
                        { backgroundColor: "#a855f7" },
                      ]}
                      onPress={() => setShowBreakModal(true)}
                      accessibilityLabel="Take a break"
                      accessibilityRole="button"
                    >
                      <MaterialIcons
                        name="coffee"
                        size={18}
                        color="white"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.breakButtonText}>Take Break</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.releaseButton,
                        { backgroundColor: colors.surfaceSecondary },
                      ]}
                      onPress={() =>
                        activeBooking && cancelBooking(activeBooking.id)
                      }
                      accessibilityLabel="Release this seat"
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.releaseButtonText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Release
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.endBreakFullButton,
                      { backgroundColor: "#a855f7" },
                    ]}
                    onPress={handleEndBreak}
                    accessibilityLabel="End break and return"
                    accessibilityRole="button"
                  >
                    <MaterialIcons
                      name="arrow-back"
                      size={18}
                      color="white"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.endBreakButtonText}>
                      Return to Seat
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <MaterialIcons
              name="event-seat"
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No active bookings
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Map")}
              style={styles.findSeatLink}
            >
              <Text style={[styles.findSeatText, { color: colors.primary }]}>
                Find a Seat
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            History
          </Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Loading history...
              </Text>
            </View>
          ) : bookings.length > 0 ? (
            bookings.map((booking, index) => {
              // Determine status display
              const isActive =
                booking.status === "active" ||
                booking.status === "pending" ||
                booking.status === "pending_checkin";
              const isCompleted = booking.status === "completed";
              const isCancelled =
                booking.status === "cancelled" ||
                booking.status === "expired" ||
                booking.status === "no_show";

              const getStatusIcon = () => {
                if (isActive) return "timer";
                if (isCompleted) return "check-circle";
                if (booking.status === "no_show") return "person-off";
                return "cancel";
              };

              const getStatusColor = () => {
                if (isActive)
                  return { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" };
                if (isCompleted)
                  return { bg: "rgba(34,197,94,0.1)", text: "#16a34a" };
                return { bg: "rgba(239,68,68,0.1)", text: "#ef4444" };
              };

              const statusColors = getStatusColor();

              return (
                <View
                  key={booking.id || index}
                  style={[
                    styles.historyItem,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View>
                    <Text style={[styles.historySeat, { color: colors.text }]}>
                      Seat {booking.seatId}
                    </Text>
                    <Text
                      style={[styles.historyDate, { color: colors.textMuted }]}
                    >
                      {new Date(booking.startTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyDuration,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {booking.duration}m
                    </Text>
                    <View
                      style={[
                        styles.historyStatusBadge,
                        { backgroundColor: statusColors.bg },
                      ]}
                    >
                      <MaterialIcons
                        name={getStatusIcon()}
                        size={16}
                        color={statusColors.text}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.noHistory, { color: colors.textMuted }]}>
              No past bookings found.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.qrModalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.qrModalHeader}>
              <Text style={[styles.qrModalTitle, { color: colors.text }]}>
                Check-in QR Code
              </Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.qrModalSubtitle, { color: colors.textSecondary }]}
            >
              Show this QR code to the scanner at the library gate
            </Text>

            <View style={styles.qrCodeWrapper}>
              {activeBooking?.verificationToken ? (
                <QRCode
                  value={activeBooking.verificationToken}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <MaterialIcons name="qr-code" size={100} color="#ccc" />
                  <Text style={{ color: colors.textMuted }}>
                    No QR code available
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.tokenDisplay,
                { backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#f1f5f9" },
              ]}
            >
              <Text
                style={[styles.tokenLabel, { color: colors.textSecondary }]}
              >
                Verification Code:
              </Text>
              <Text style={[styles.tokenValue, { color: colors.text }]}>
                {activeBooking?.verificationToken || "N/A"}
              </Text>
            </View>

            {checkinTimeRemaining !== null && (
              <View
                style={[
                  styles.timerInModal,
                  {
                    backgroundColor: isCheckinUrgent
                      ? isDark
                        ? "rgba(239,68,68,0.15)"
                        : "#fef2f2"
                      : isDark
                        ? "rgba(59,130,246,0.15)"
                        : "#eff6ff",
                  },
                ]}
              >
                <MaterialIcons
                  name="access-time"
                  size={20}
                  color={isCheckinUrgent ? "#ef4444" : colors.primary}
                />
                <Text
                  style={[
                    styles.timerInModalText,
                    { color: isCheckinUrgent ? "#ef4444" : colors.primary },
                  ]}
                >
                  {formatTime(checkinTimeRemaining)} remaining
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Break Duration Modal */}
      <Modal
        visible={showBreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBreakModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.breakModalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.breakModalHeader}>
              <Text style={[styles.breakModalTitle, { color: colors.text }]}>
                Take a Break
              </Text>
              <TouchableOpacity onPress={() => setShowBreakModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.breakModalSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              Select break duration (max 30 minutes).{"\n"}
              Your seat will be released if you don't return in time.
            </Text>

            <View style={styles.breakDurationOptions}>
              {[10, 15, 20, 30].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.breakDurationOption,
                    breakDuration === mins &&
                      styles.breakDurationOptionSelected,
                    {
                      borderColor:
                        breakDuration === mins ? "#a855f7" : colors.border,
                    },
                  ]}
                  onPress={() => setBreakDuration(mins)}
                >
                  <Text
                    style={[
                      styles.breakDurationText,
                      {
                        color: breakDuration === mins ? "#a855f7" : colors.text,
                      },
                    ]}
                  >
                    {mins} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[
                styles.breakWarning,
                {
                  backgroundColor: isDark ? "rgba(251,191,36,0.15)" : "#fffbeb",
                },
              ]}
            >
              <MaterialIcons name="warning" size={20} color="#f59e0b" />
              <Text
                style={[
                  styles.breakWarningText,
                  { color: colors.textSecondary },
                ]}
              >
                Your location will be checked when break ends. Return to the
                library to keep your seat.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.startBreakButton, { backgroundColor: "#a855f7" }]}
              onPress={handleStartBreak}
              disabled={isStartingBreak}
            >
              {isStartingBreak ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons
                    name="coffee"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.startBreakButtonText}>
                    Start {breakDuration} min Break
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontWeight: "700",
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
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  activeCard: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  seatTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  pendingBadge: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
  },
  breakBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  checkedInText: {
    color: "#16a34a",
  },
  pendingText: {
    color: "#ca8a04",
  },
  breakText: {
    color: "#a855f7",
  },
  checkinTimerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  checkinTimerContent: {
    flex: 1,
  },
  checkinTimerLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkinTimerValue: {
    fontSize: 24,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  showQRButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  breakTimerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  breakTimerContent: {
    flex: 1,
  },
  breakTimerLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  breakTimerValue: {
    fontSize: 24,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  endBreakButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  endBreakButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  timerText: {
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  checkInButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkInButtonText: {
    color: "white",
    fontWeight: "700",
  },
  breakButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  breakButtonText: {
    color: "white",
    fontWeight: "700",
  },
  endBreakFullButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  releaseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  releaseButtonText: {
    fontWeight: "700",
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
  },
  findSeatLink: {
    marginTop: 16,
  },
  findSeatText: {
    fontWeight: "700",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historySeat: {
    fontWeight: "700",
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyDuration: {
    fontWeight: "700",
  },
  historyStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  noHistory: {
    textAlign: "center",
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrModalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  qrModalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  qrModalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenDisplay: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
  },
  timerInModal: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  timerInModalText: {
    fontWeight: "700",
  },
  // Break modal styles
  breakModalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
  },
  breakModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  breakModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  breakModalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  breakDurationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  breakDurationOption: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  breakDurationOptionSelected: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  breakDurationText: {
    fontWeight: "700",
    fontSize: 16,
  },
  breakWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  breakWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  startBreakButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  startBreakButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default BookingsScreen;
