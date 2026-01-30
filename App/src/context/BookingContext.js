import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as api from "../services/api";
import { useAuth } from "./AuthContext";
import { useLibrary } from "./LibraryContext";

const BookingContext = createContext();

// Fallback user ID for development
const FALLBACK_USER_ID = 1;

// Timer constants
const CHECKIN_DEADLINE_MINUTES = 15;
const MAX_BREAK_MINUTES = 30;
const BAN_DURATION_MINUTES = 30;

export const BookingProvider = ({ children }) => {
  const { userInfo } = useAuth();
  const { selectedLibrary } = useLibrary();

  // Use authenticated user ID or fallback
  const userId = useMemo(
    () => userInfo?.id || FALLBACK_USER_ID,
    [userInfo?.id],
  );

  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for enhanced workflow
  const [bookingBan, setBookingBan] = useState({
    isBanned: false,
    bannedUntil: null,
  });
  const [checkinTimeRemaining, setCheckinTimeRemaining] = useState(null); // seconds
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(null); // seconds

  // Timer refs
  const checkinTimerRef = useRef(null);
  const breakTimerRef = useRef(null);
  const activeBookingRef = useRef(null);

  // Keep activeBookingRef in sync with activeBooking state
  useEffect(() => {
    activeBookingRef.current = activeBooking;
  }, [activeBooking]);

  // Check booking ban status
  const checkBanStatus = useCallback(async () => {
    const { isBanned, bannedUntil } = await api.checkBookingBan(userId);
    setBookingBan({ isBanned, bannedUntil });
    return { isBanned, bannedUntil };
  }, [userId]);

  // Fetch active booking when user changes
  useEffect(() => {
    fetchActiveBooking();
    checkBanStatus();
  }, [userId]);

  // Handle check-in deadline expiry
  const handleCheckinExpiry = useCallback(async () => {
    const currentBooking = activeBookingRef.current;
    if (!currentBooking) return;

    const { released } = await api.releaseExpiredBooking(currentBooking.id);
    if (released) {
      setActiveBooking(null);
      setCheckinTimeRemaining(null);
      // Refresh ban status
      checkBanStatus();
    }
  }, [checkBanStatus]);

  // Start check-in countdown timer
  const startCheckinTimer = useCallback(
    (deadline) => {
      // Clear any existing timer
      if (checkinTimerRef.current) {
        clearInterval(checkinTimerRef.current);
      }

      const updateTimer = () => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const remaining = Math.max(0, Math.floor((deadlineDate - now) / 1000));

        setCheckinTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(checkinTimerRef.current);
          // Auto-release the booking using ref
          if (activeBookingRef.current) {
            handleCheckinExpiry();
          }
        }
      };

      updateTimer();
      checkinTimerRef.current = setInterval(updateTimer, 1000);
    },
    [handleCheckinExpiry],
  );

  // Start break countdown timer
  const startBreakTimer = useCallback((breakStartedAt, breakDuration) => {
    if (breakTimerRef.current) {
      clearInterval(breakTimerRef.current);
    }

    const updateTimer = () => {
      const now = new Date();
      const breakEnd = new Date(breakStartedAt);
      breakEnd.setMinutes(breakEnd.getMinutes() + breakDuration);
      const remaining = Math.max(0, Math.floor((breakEnd - now) / 1000));

      setBreakTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(breakTimerRef.current);
        // Break expired - will be handled by location check
      }
    };

    updateTimer();
    breakTimerRef.current = setInterval(updateTimer, 1000);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (checkinTimerRef.current) clearInterval(checkinTimerRef.current);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, []);

  const fetchActiveBooking = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.getActiveBooking(userId);
      if (
        apiError &&
        apiError !== "JSON object requested, multiple (or no) rows returned"
      ) {
        setError(apiError.message);
      } else if (data) {
        const booking = {
          id: data.id,
          seatId: data.seat_id,
          location: data.location || "Library",
          startTime: new Date(data.start_time).getTime(),
          duration: data.duration,
          status: data.status,
          checkedIn: data.checked_in,
          expiresAt:
            new Date(data.start_time).getTime() + data.duration * 60 * 1000,
          // New fields
          checkinDeadline: data.checkin_deadline,
          verificationToken: data.verification_token,
          isOnBreak: data.is_on_break,
          breakStartedAt: data.break_started_at,
          breakDuration: data.break_duration,
        };
        setActiveBooking(booking);

        // Start appropriate timer
        if (!data.checked_in && data.checkin_deadline) {
          startCheckinTimer(data.checkin_deadline);
        } else if (data.is_on_break && data.break_started_at) {
          startBreakTimer(
            data.break_started_at,
            data.break_duration || MAX_BREAK_MINUTES,
          );
        }
      } else {
        setActiveBooking(null);
        setCheckinTimeRemaining(null);
        setBreakTimeRemaining(null);
      }
    } catch (err) {
      console.error("Error fetching active booking:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, startCheckinTimer, startBreakTimer]);

  const fetchBookingHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: apiError } = await api.getBookingHistory(userId);
      if (!apiError && data) {
        setBookings(
          data.map((b) => ({
            id: b.id,
            seatId: b.seat_id,
            location: b.location || "Library",
            startTime: new Date(b.start_time).getTime(),
            duration: b.duration,
            status: b.status,
            checkedIn: b.checked_in,
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching booking history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createBooking = async (seatId, duration, location) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user already has an active or pending booking
      if (activeBooking) {
        const isPending =
          !activeBooking.checkedIn && activeBooking.status === "pending";
        const isActive =
          activeBooking.checkedIn || activeBooking.status === "active";

        if (isPending) {
          setError(
            "You already have a pending booking. Please check in or cancel it first.",
          );
          return null;
        }
        if (isActive) {
          setError(
            "You already have an active session. Please complete or release it first.",
          );
          return null;
        }
      }

      // Check if user is banned
      const { isBanned, bannedUntil } = await checkBanStatus();
      if (isBanned) {
        const minutesLeft = Math.ceil(
          (new Date(bannedUntil) - new Date()) / 60000,
        );
        setError(
          `You are temporarily banned from booking. Please wait ${minutesLeft} minutes.`,
        );
        return null;
      }

      const libraryId = selectedLibrary?.id || null;
      const { data, error: apiError } = await api.createBooking(
        userId,
        seatId,
        duration,
        location,
        libraryId,
      );

      if (apiError) {
        setError(apiError.message);
        return null;
      }

      const newBooking = {
        id: data.id || `bk_${Date.now()}`,
        seatId: data.seat_id || seatId,
        location: data.location || location,
        startTime: Date.now(),
        duration,
        status: "pending", // Always starts as pending until QR verification
        checkedIn: false,
        expiresAt: Date.now() + duration * 60 * 1000,
        // New fields from DB trigger
        checkinDeadline: data.checkin_deadline,
        verificationToken: data.verification_token,
        isOnBreak: false,
      };

      setActiveBooking(newBooking);
      setBookings((prev) => [newBooking, ...prev]);

      // Start 15-minute check-in timer
      if (data.checkin_deadline) {
        startCheckinTimer(data.checkin_deadline);
      }

      return newBooking;
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Failed to create booking");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async (bookingId) => {
    if (!activeBooking || activeBooking.id !== bookingId) return;

    try {
      await api.checkInBooking(bookingId, activeBooking.seatId);
      setActiveBooking((prev) => ({
        ...prev,
        status: "active",
        checkedIn: true,
        checkinDeadline: null,
      }));
      // Stop check-in timer
      if (checkinTimerRef.current) {
        clearInterval(checkinTimerRef.current);
      }
      setCheckinTimeRemaining(null);
    } catch (err) {
      console.error("Error checking in:", err);
    }
  };

  // Verify check-in using QR token (for gate scanner verification)
  const verifyCheckinWithToken = async (token) => {
    try {
      const { data, error: apiError } = await api.verifyCheckIn(token);
      if (apiError) {
        return { success: false, error: apiError };
      }

      // Refresh active booking
      await fetchActiveBooking();
      return { success: true, data };
    } catch (err) {
      console.error("Error verifying check-in:", err);
      return { success: false, error: err.message };
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!activeBooking || activeBooking.id !== bookingId) return;

    try {
      await api.cancelBooking(bookingId, activeBooking.seatId);
      setActiveBooking(null);
      setCheckinTimeRemaining(null);
      setBreakTimeRemaining(null);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      // Stop timers
      if (checkinTimerRef.current) clearInterval(checkinTimerRef.current);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    } catch (err) {
      console.error("Error cancelling booking:", err);
    }
  };

  const completeBooking = async (bookingId) => {
    if (!activeBooking || activeBooking.id !== bookingId) return;

    try {
      await api.completeBooking(bookingId, activeBooking.seatId);
      setActiveBooking(null);
      setBreakTimeRemaining(null);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "completed" } : b,
        ),
      );
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    } catch (err) {
      console.error("Error completing booking:", err);
    }
  };

  // Start a break (max 30 minutes)
  const startBreak = async (breakDuration = MAX_BREAK_MINUTES) => {
    if (!activeBooking || !activeBooking.checkedIn) return { success: false };

    try {
      const duration = Math.min(breakDuration, MAX_BREAK_MINUTES);
      const { data, error: apiError } = await api.startBreak(
        activeBooking.id,
        duration,
      );

      if (apiError) {
        return { success: false, error: apiError };
      }

      setActiveBooking((prev) => ({
        ...prev,
        isOnBreak: true,
        breakStartedAt: data.break_started_at,
        breakDuration: duration,
      }));

      startBreakTimer(data.break_started_at, duration);
      return { success: true };
    } catch (err) {
      console.error("Error starting break:", err);
      return { success: false, error: err.message };
    }
  };

  // End break and return to seat
  const endBreak = async () => {
    if (!activeBooking || !activeBooking.isOnBreak) return { success: false };

    try {
      await api.endBreak(activeBooking.id);

      setActiveBooking((prev) => ({
        ...prev,
        isOnBreak: false,
        breakStartedAt: null,
        breakDuration: 0,
      }));

      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
      setBreakTimeRemaining(null);
      return { success: true };
    } catch (err) {
      console.error("Error ending break:", err);
      return { success: false, error: err.message };
    }
  };

  // Check break expiry with location (called when break timer ends)
  const checkBreakExpiry = async (isInRange) => {
    if (!activeBooking) return;

    const { released } = await api.checkBreakExpiry(
      activeBooking.id,
      isInRange,
    );
    if (released) {
      setActiveBooking(null);
      setBreakTimeRemaining(null);
    } else {
      // Break ended, user returned
      await endBreak();
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        activeBooking,
        isLoading,
        error,
        // Timer states
        checkinTimeRemaining,
        breakTimeRemaining,
        bookingBan,
        // Core actions
        createBooking,
        checkIn,
        verifyCheckinWithToken,
        cancelBooking,
        completeBooking,
        fetchActiveBooking,
        fetchBookingHistory,
        // New workflow actions
        checkBanStatus,
        startBreak,
        endBreak,
        checkBreakExpiry,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
