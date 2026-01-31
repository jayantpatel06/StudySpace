import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { successNotification } from "../utils/haptics";
import * as api from "../services/api";

const FocusTimerContext = createContext();

// Points configuration
const POINTS_PER_FOCUS_BLOCK = 25;
const BREAK_DURATION = 5 * 60; // 5 minutes
const DEFAULT_DURATION = 25 * 60; // 25 minutes

export const FocusTimerProvider = ({ children }) => {
  const { userInfo } = useAuth();

  // Timer states
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [workDuration, setWorkDuration] = useState(DEFAULT_DURATION);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATION);
  const [isPaused, setIsPaused] = useState(true);
  const [isBreak, setIsBreak] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs for accurate time tracking
  const lastTickRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // Check if timer is running
  const isTimerRunning = !isPaused && sessionStarted;

  // Handle phase completion
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
            workDuration / 60,
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

  // Timer countdown effect - runs continuously in background
  useEffect(() => {
    if (isPaused || secondsLeft <= 0) {
      if (secondsLeft <= 0 && !isPaused && sessionStarted) {
        handlePhaseComplete();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      if (elapsed > 0) {
        setSecondsLeft((prev) => {
          const newValue = Math.max(0, prev - elapsed);
          return newValue;
        });

        // Track focus time (not break time)
        if (!isBreak) {
          setTotalFocusTime((t) => t + elapsed);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, isBreak, sessionStarted, handlePhaseComplete]);

  // Check for phase completion
  useEffect(() => {
    if (secondsLeft <= 0 && !isPaused && sessionStarted) {
      handlePhaseComplete();
    }
  }, [secondsLeft, isPaused, sessionStarted, handlePhaseComplete]);

  // Start timer
  const startTimer = useCallback((duration = null) => {
    if (duration) {
      setWorkDuration(duration * 60);
      setSecondsLeft(duration * 60);
      setSelectedPreset(duration);
    }
    setSessionStarted(true);
    setIsPaused(false);
    lastTickRef.current = Date.now();
  }, []);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    lastTickRef.current = Date.now();
  }, []);

  // Toggle pause/resume
  const toggleTimer = useCallback(() => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  }, [isPaused, pauseTimer, resumeTimer]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsPaused(true);
    setIsBreak(false);
    setSecondsLeft(workDuration);
    setSessionStarted(false);
    setShowConfetti(false);
  }, [workDuration]);

  // End session completely
  const endSession = useCallback(() => {
    setIsPaused(true);
    setIsBreak(false);
    setSecondsLeft(DEFAULT_DURATION);
    setWorkDuration(DEFAULT_DURATION);
    setSelectedPreset(25);
    setCompletedBlocks(0);
    setTotalFocusTime(0);
    setPointsEarned(0);
    setSessionStarted(false);
    setShowConfetti(false);
  }, []);

  // Select preset duration
  const selectPreset = useCallback(
    (minutes) => {
      setSelectedPreset(minutes);
      setWorkDuration(minutes * 60);
      if (!sessionStarted) {
        setSecondsLeft(minutes * 60);
      }
    },
    [sessionStarted],
  );

  // Format time helper
  const formatTime = useCallback((totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Get progress percentage
  const getProgress = useCallback(() => {
    const total = isBreak ? BREAK_DURATION : workDuration;
    return total > 0 ? (total - secondsLeft) / total : 0;
  }, [isBreak, workDuration, secondsLeft]);

  const value = {
    // State
    selectedPreset,
    workDuration,
    secondsLeft,
    isPaused,
    isBreak,
    completedBlocks,
    totalFocusTime,
    sessionStarted,
    pointsEarned,
    showConfetti,
    isTimerRunning,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    toggleTimer,
    resetTimer,
    endSession,
    selectPreset,
    setShowConfetti,

    // Helpers
    formatTime,
    getProgress,

    // Constants
    POINTS_PER_FOCUS_BLOCK,
    BREAK_DURATION,
  };

  return (
    <FocusTimerContext.Provider value={value}>
      {children}
    </FocusTimerContext.Provider>
  );
};

export const useFocusTimer = () => {
  const context = useContext(FocusTimerContext);
  if (!context) {
    throw new Error("useFocusTimer must be used within a FocusTimerProvider");
  }
  return context;
};

export default FocusTimerContext;
