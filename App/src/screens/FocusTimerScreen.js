import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated as RNAnimated,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { successNotification, lightImpact } from "../utils/haptics";
import * as api from "../services/api";

// Timer presets in minutes
const TIMER_PRESETS = [
  { label: "15 min", value: 15 },
  { label: "25 min", value: 25 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

// Points configuration
const POINTS_PER_FOCUS_BLOCK = 25;
const BREAK_DURATION = 5 * 60; // 5 minutes

// Simple Confetti Component
const Confetti = ({ visible }) => {
  const particles = useRef(
    Array(20)
      .fill(null)
      .map(() => ({
        x: new RNAnimated.Value(Math.random() * 300),
        y: new RNAnimated.Value(-50),
        color: ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"][
          Math.floor(Math.random() * 5)
        ],
        size: Math.random() * 8 + 4,
      })),
  ).current;

  useEffect(() => {
    if (visible) {
      particles.forEach((p, i) => {
        p.y.setValue(-50);
        RNAnimated.timing(p.y, {
          toValue: 600,
          duration: 2000 + Math.random() * 1000,
          delay: i * 50,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p, i) => (
        <RNAnimated.View
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            transform: [{ translateY: p.y }],
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
          }}
        />
      ))}
    </View>
  );
};

const FocusTimerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const { activeBooking } = useBooking();
  const { userInfo } = useAuth();

  // Get initial duration from route params or default to 25 min
  const initialDuration = (route.params?.duration || 25) * 60;

  // Timer states
  const [selectedPreset, setSelectedPreset] = useState(
    route.params?.duration || 25,
  );
  const [workDuration, setWorkDuration] = useState(initialDuration);
  const [secondsLeft, setSecondsLeft] = useState(initialDuration);
  const [isPaused, setIsPaused] = useState(true); // Start paused so user can select duration
  const [isBreak, setIsBreak] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0); // in seconds
  const [sessionStarted, setSessionStarted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  // Track session start time for accurate time tracking
  const sessionStartTimeRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Fetch active users count from API
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const libraryId = activeBooking?.libraryId || null;
        const { count, error } = await api.getActiveUsersCount(libraryId);
        if (!error) {
          setActiveUsers(count);
        }
      } catch (err) {
        console.error("Error fetching active users:", err);
      }
    };
    fetchActiveUsers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [activeBooking?.libraryId]);

  // Handle timer countdown with real-time accuracy
  useEffect(() => {
    if (isPaused || secondsLeft <= 0) {
      if (secondsLeft <= 0 && !isPaused && sessionStarted) {
        handlePhaseComplete();
      }
      return undefined;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      setSecondsLeft((prev) => {
        const newValue = Math.max(0, prev - elapsed);
        // Track focus time (not break time)
        if (!isBreak && elapsed > 0) {
          setTotalFocusTime((t) => t + elapsed);
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, isBreak, sessionStarted]);

  // Handle phase completion (work or break)
  const handlePhaseComplete = useCallback(async () => {
    successNotification();

    if (!isBreak) {
      // Work phase completed
      setShowConfetti(true);
      const newCompletedBlocks = completedBlocks + 1;
      setCompletedBlocks(newCompletedBlocks);

      // Award points
      const newPoints = pointsEarned + POINTS_PER_FOCUS_BLOCK;
      setPointsEarned(newPoints);

      // Save session to database
      if (userInfo?.id) {
        try {
          await api.recordFocusSession(
            userInfo.id,
            workDuration / 60, // duration in minutes
            POINTS_PER_FOCUS_BLOCK,
          );
        } catch (err) {
          console.error("Error recording focus session:", err);
        }
      }

      setTimeout(() => {
        setShowConfetti(false);
        setIsBreak(true);
        setSecondsLeft(BREAK_DURATION);
        lastTickRef.current = Date.now();
      }, 2500);
    } else {
      // Break completed - switch back to work
      setIsBreak(false);
      setSecondsLeft(workDuration);
      lastTickRef.current = Date.now();
    }
  }, [isBreak, completedBlocks, pointsEarned, workDuration, userInfo?.id]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatTotalTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePresetSelect = (preset) => {
    if (sessionStarted && !isPaused) {
      Alert.alert(
        "Change Duration?",
        "This will reset your current session. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: () => {
              lightImpact();
              setSelectedPreset(preset);
              setWorkDuration(preset * 60);
              setSecondsLeft(preset * 60);
              setIsBreak(false);
              setSessionStarted(false);
              setIsPaused(true);
            },
          },
        ],
      );
    } else {
      lightImpact();
      setSelectedPreset(preset);
      setWorkDuration(preset * 60);
      setSecondsLeft(preset * 60);
      setIsBreak(false);
    }
  };

  const togglePause = () => {
    lightImpact();
    if (!sessionStarted) {
      setSessionStarted(true);
      sessionStartTimeRef.current = Date.now();
    }
    lastTickRef.current = Date.now();
    setIsPaused((prev) => !prev);
  };

  const handleReset = () => {
    lightImpact();
    Alert.alert(
      "Reset Session?",
      "This will reset your current focus block. Your completed blocks and points will be kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setSecondsLeft(workDuration);
            setIsBreak(false);
            setIsPaused(true);
            setSessionStarted(false);
          },
        },
      ],
    );
  };

  const handleLeave = () => {
    lightImpact();
    if (sessionStarted && totalFocusTime > 60) {
      // If they've focused for more than a minute, confirm
      Alert.alert(
        "End Focus Session?",
        `You've earned ${pointsEarned} points and completed ${completedBlocks} focus blocks. Are you sure you want to leave?`,
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSkipBreak = () => {
    lightImpact();
    setIsBreak(false);
    setSecondsLeft(workDuration);
    lastTickRef.current = Date.now();
  };

  // Calculate progress for the ring
  const totalDuration = isBreak ? BREAK_DURATION : workDuration;
  const progress = secondsLeft / totalDuration;
  const circumference = 2 * Math.PI * 130; // r = 130
  const strokeDashoffset = circumference * (1 - progress);

  // Ring color changes based on phase
  const ringColor = isBreak ? colors.success : colors.primary;

  const getStatusText = () => {
    if (secondsLeft === 0) return showConfetti ? "🎉 GREAT JOB!" : "COMPLETED";
    if (!sessionStarted) return "READY TO START";
    if (isPaused) return "PAUSED";
    return isBreak ? "BREAK TIME" : "FOCUSING";
  };

  // Get location info from active booking
  const getLocationText = () => {
    if (activeBooking?.location) {
      return activeBooking.location;
    }
    return "Focus Session";
  };

  const getSeatText = () => {
    if (activeBooking?.seatId) {
      return `Seat ${activeBooking.seatId}`;
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Confetti Overlay */}
      <Confetti visible={showConfetti} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={handleLeave} style={styles.headerButton}>
          <MaterialIcons
            name="arrow-back-ios-new"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {getLocationText()}
          </Text>
          {getSeatText() && (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {getSeatText()}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.headerButton,
            styles.lightModeButton,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <MaterialIcons
            name={isBreak ? "local-cafe" : "timer"}
            size={24}
            color={colors.primary}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Presets (only when not in break) */}
        {!isBreak && !sessionStarted && (
          <View style={styles.presetsContainer}>
            <Text
              style={[styles.presetsLabel, { color: colors.textSecondary }]}
            >
              Select Duration
            </Text>
            <View style={styles.presetsRow}>
              {TIMER_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor:
                        selectedPreset === preset.value
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        selectedPreset === preset.value
                          ? colors.primary
                          : colors.borderLight,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color:
                          selectedPreset === preset.value
                            ? "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Live Indicators */}
        <View
          style={[
            styles.liveIndicator,
            {
              backgroundColor: isBreak
                ? "rgba(34, 197, 94, 0.1)"
                : colors.primaryLight,
            },
          ]}
        >
          <View
            style={[
              styles.liveDot,
              {
                backgroundColor: isBreak
                  ? colors.success
                  : sessionStarted && !isPaused
                    ? colors.error
                    : colors.primary,
              },
            ]}
          />
          <Text
            style={[
              styles.liveText,
              { color: isBreak ? colors.success : colors.primary },
            ]}
          >
            {isBreak
              ? "Break Time"
              : sessionStarted && !isPaused
                ? "Live Session"
                : "Ready"}
          </Text>
        </View>

        {/* Session Stats */}
        {sessionStarted && (
          <View style={styles.statsRow}>
            <View
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <MaterialIcons name="whatshot" size={20} color="#f59e0b" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {completedBlocks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Blocks
              </Text>
            </View>
            <View
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatTotalTime(totalFocusTime)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Focus
              </Text>
            </View>
            <View
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <MaterialIcons name="stars" size={20} color="#a855f7" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {pointsEarned}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Points
              </Text>
            </View>
          </View>
        )}

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Svg height="280" width="280" viewBox="0 0 280 280">
            <Circle
              cx="140"
              cy="140"
              r="130"
              stroke={isDark ? colors.border : "#e2e8f0"}
              strokeWidth="12"
              fill="transparent"
            />
            <Circle
              cx="140"
              cy="140"
              r="130"
              stroke={ringColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin="140, 140"
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {formatTime(secondsLeft)}
            </Text>
            <Text
              style={[
                styles.timerLabel,
                { color: isBreak ? colors.success : colors.primary },
              ]}
            >
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Active Users */}
        <View style={styles.avatarsRow}>
          {activeUsers > 0 &&
            [...Array(Math.min(3, activeUsers))].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.avatarContainer,
                  {
                    borderColor: colors.surface,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            ))}
          {activeUsers > 3 && (
            <View
              style={[
                styles.avatarContainer,
                styles.moreAvatar,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.moreAvatarText}>+{activeUsers - 3}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.studentsText, { color: colors.textSecondary }]}>
          {activeUsers} {activeUsers === 1 ? "student is" : "students are"}{" "}
          focusing now
        </Text>

        {/* Progress Bar */}
        <View
          style={[styles.progressCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text
                style={[styles.progressLabel, { color: colors.textSecondary }]}
              >
                Session Progress
              </Text>
              <Text style={[styles.progressValue, { color: colors.text }]}>
                {completedBlocks} Focus{" "}
                {completedBlocks === 1 ? "Block" : "Blocks"} Completed
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <MaterialIcons name="stars" size={16} color="#a855f7" />
              <Text style={styles.pointsBadgeText}>{pointsEarned} pts</Text>
            </View>
          </View>
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, (completedBlocks / 4) * 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressHint, { color: colors.textMuted }]}>
            Complete 4 blocks to earn bonus points!
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.pauseButton,
              { backgroundColor: isBreak ? colors.success : colors.primary },
            ]}
            onPress={togglePause}
          >
            <MaterialIcons
              name={
                !sessionStarted
                  ? "play-arrow"
                  : isPaused
                    ? "play-arrow"
                    : "pause"
              }
              size={24}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.pauseButtonText}>
              {!sessionStarted ? "Start Focus" : isPaused ? "Resume" : "Pause"}
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryControls}>
            {isBreak && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={handleSkipBreak}
              >
                <MaterialIcons
                  name="skip-next"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Skip Break
                </Text>
              </TouchableOpacity>
            )}

            {sessionStarted && !isBreak && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={handleReset}
              >
                <MaterialIcons
                  name="refresh"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Reset
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={handleLeave}
            >
              <MaterialIcons
                name="exit-to-app"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                Leave
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  lightModeButton: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202124",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    paddingBottom: 32,
  },
  presetsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
    width: "100%",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timerContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  timerTextContainer: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#202124",
  },
  timerLabel: {
    color: "#64748b",
    fontWeight: "600",
    marginTop: 8,
    fontSize: 14,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  moreAvatar: {
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  moreAvatarText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  studentsText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 24,
  },
  progressCard: {
    width: "100%",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressValue: {
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "700",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsBadgeText: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  controls: {
    width: "100%",
    gap: 12,
  },
  pauseButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  pauseButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});

export default FocusTimerScreen;
