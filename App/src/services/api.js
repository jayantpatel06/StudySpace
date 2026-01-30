import { supabase, isSupabaseConfigured } from "../config/supabase";

// Helper to ensure Supabase is configured
const requireSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase not configured. Please add your credentials to src/config/supabase.js",
    );
  }
};

// ============================================
// SEATS API
// ============================================

/**
 * Get all seats with their current status
 * @param {number} floor - Optional floor filter
 */
export const getSeats = async (floor = null) => {
  requireSupabase();

  let query = supabase.from("seats").select("*");
  if (floor) {
    query = query.eq("floor", floor);
  }
  return await query.order("id");
};

/**
 * Get heatmap data for the seat map
 */
export const getSeatHeatmap = async (floor = 1) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("seats")
    .select(
      "id, label, status, floor, zone, has_power, is_quiet_zone, has_lamp, has_ergo_chair, has_wifi, wifi_speed",
    )
    .eq("floor", floor);

  return { data, error };
};

// ============================================
// LIBRARY STRUCTURE API (Floors, Rooms, Seats)
// ============================================

/**
 * Get all floors for a library
 */
export const getLibraryFloors = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("floors")
    .select("*")
    .eq("library_id", libraryId)
    .eq("is_active", true)
    .order("floor_number");
};

/**
 * Get all rooms for a library or specific floor
 */
export const getLibraryRooms = async (libraryId, floorId = null) => {
  requireSupabase();

  let query = supabase
    .from("rooms")
    .select("*, floor:floors(floor_number, floor_name)")
    .eq("library_id", libraryId)
    .eq("is_active", true);

  if (floorId) {
    query = query.eq("floor_id", floorId);
  }

  return await query.order("room_name");
};

/**
 * Get seats for a specific room with matrix layout
 */
export const getRoomSeats = async (roomId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("seats")
    .select(
      `
            id, label, status, floor, zone, 
            has_power, is_quiet_zone, has_lamp, has_ergo_chair, has_wifi, wifi_speed,
            room_id, row_number, column_number, seat_number, is_active
        `,
    )
    .eq("room_id", roomId)
    .eq("is_active", true)
    .order("row_number")
    .order("column_number");

  return { data, error };
};

/**
 * Get all seats for a library with room info
 */
export const getLibrarySeatsWithRooms = async (libraryId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("seats")
    .select(
      `
            id, label, status, floor, zone, 
            has_power, is_quiet_zone, has_lamp, has_ergo_chair, has_wifi, wifi_speed,
            room_id, row_number, column_number, seat_number, is_active,
            room:rooms(id, room_name, room_code, room_type, floor_id)
        `,
    )
    .eq("library_id", libraryId)
    .eq("is_active", true)
    .order("room_id")
    .order("row_number")
    .order("column_number");

  return { data, error };
};

/**
 * Get seat heatmap for a specific floor in a library
 */
export const getLibrarySeatHeatmap = async (libraryId, floorId = null) => {
  requireSupabase();

  let query = supabase
    .from("seats")
    .select(
      `
            id, label, status, floor, zone, 
            has_power, is_quiet_zone, has_lamp, has_ergo_chair, has_wifi, wifi_speed, is_active,
            room_id, row_number, column_number,
            room:rooms(id, room_name, room_code, floor_id)
        `,
    )
    .eq("library_id", libraryId)
    .eq("is_active", true);

  // If floorId provided, filter rooms by floor
  if (floorId) {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("floor_id", floorId);

    if (rooms && rooms.length > 0) {
      const roomIds = rooms.map((r) => r.id);
      query = query.in("room_id", roomIds);
    }
  }

  const { data, error } = await query
    .order("room_id")
    .order("row_number")
    .order("column_number");
  return { data, error };
};

/**
 * Get single seat details with room and floor info
 */
export const getSeatById = async (seatId) => {
  requireSupabase();

  return await supabase
    .from("seats")
    .select(
      `
            *,
            room:rooms(
                id, room_name, room_code, room_type, 
                floor:floors(id, floor_number, floor_name)
            )
        `,
    )
    .eq("id", seatId)
    .single();
};

/**
 * Get library settings including rewards configuration
 */
export const getLibrarySettings = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("library_settings")
    .select("*")
    .eq("library_id", libraryId)
    .single();
};

/**
 * Update seat status (used internally when bookings change)
 */
export const updateSeatStatus = async (seatId, status) => {
  requireSupabase();

  return await supabase.from("seats").update({ status }).eq("id", seatId);
};

// ============================================
// BOOKINGS API
// ============================================

/**
 * Create a new booking
 */
export const createBooking = async (
  userId,
  seatId,
  duration,
  location,
  libraryId = null,
) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      seat_id: seatId,
      library_id: libraryId,
      start_time: new Date().toISOString(),
      duration,
      location,
      status: "pending",
      checked_in: false,
    })
    .select()
    .single();

  if (!error && data) {
    await updateSeatStatus(seatId, "reserved");
  }

  return { data, error };
};

/**
 * Get count of active users (checked in) at a library
 */
export const getActiveUsersCount = async (libraryId = null) => {
  requireSupabase();

  let query = supabase
    .from("bookings")
    .select("user_id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("checked_in", true);

  if (libraryId) {
    query = query.eq("library_id", libraryId);
  }

  const { count, error } = await query;
  return { count: count || 0, error };
};

/**
 * Get active booking for a user
 */
export const getActiveBooking = async (userId) => {
  requireSupabase();

  return await supabase
    .from("bookings")
    .select("*, seats(*)")
    .eq("user_id", userId)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
};

/**
 * Get booking history for a user
 */
export const getBookingHistory = async (userId, limit = 10) => {
  requireSupabase();

  return await supabase
    .from("bookings")
    .select("*, seats(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
};

/**
 * Check in to a booking
 */
export const checkInBooking = async (bookingId, seatId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .update({ checked_in: true, status: "active" })
    .eq("id", bookingId)
    .select()
    .single();

  if (!error && seatId) {
    await updateSeatStatus(seatId, "occupied");
  }

  return { data, error };
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId, seatId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select()
    .single();

  if (!error && seatId) {
    await updateSeatStatus(seatId, "available");
  }

  return { data, error };
};

/**
 * Complete a booking (checkout)
 */
export const completeBooking = async (bookingId, seatId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "completed", is_on_break: false })
    .eq("id", bookingId)
    .select()
    .single();

  if (!error && seatId) {
    await updateSeatStatus(seatId, "available");
  }

  return { data, error };
};

// ============================================
// ENHANCED BOOKING WORKFLOW API
// ============================================

/**
 * Check if user is banned from booking
 */
export const checkBookingBan = async (userId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("booking_banned_until")
    .eq("id", userId)
    .single();

  if (error) return { isBanned: false, bannedUntil: null, error };

  const bannedUntil = data?.booking_banned_until;
  if (bannedUntil && new Date(bannedUntil) > new Date()) {
    return { isBanned: true, bannedUntil: new Date(bannedUntil), error: null };
  }

  return { isBanned: false, bannedUntil: null, error: null };
};

/**
 * Verify check-in with token (for gate scanner)
 */
export const verifyCheckIn = async (verificationToken) => {
  requireSupabase();

  // Find booking with this verification token
  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("*, seats(*), users(*)")
    .eq("verification_token", verificationToken)
    .eq("status", "pending")
    .eq("checked_in", false)
    .single();

  if (findError || !booking) {
    return { data: null, error: "Invalid or expired verification code" };
  }

  // Check if check-in deadline has passed
  if (
    booking.checkin_deadline &&
    new Date(booking.checkin_deadline) < new Date()
  ) {
    return { data: null, error: "Check-in deadline has passed" };
  }

  // Perform check-in
  const { data, error } = await supabase
    .from("bookings")
    .update({
      checked_in: true,
      status: "active",
      checkin_deadline: null, // Clear deadline after check-in
    })
    .eq("id", booking.id)
    .select()
    .single();

  if (!error && booking.seat_id) {
    await updateSeatStatus(booking.seat_id, "occupied");
  }

  return { data, error };
};

/**
 * Start a break (max 30 minutes)
 */
export const startBreak = async (bookingId, breakDuration = 30) => {
  requireSupabase();

  // Cap break at 30 minutes
  const duration = Math.min(breakDuration, 30);

  const { data, error } = await supabase
    .from("bookings")
    .update({
      is_on_break: true,
      break_started_at: new Date().toISOString(),
      break_duration: duration,
    })
    .eq("id", bookingId)
    .eq("status", "active")
    .select()
    .single();

  return { data, error };
};

/**
 * End break and return to seat
 */
export const endBreak = async (bookingId) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .update({
      is_on_break: false,
      break_started_at: null,
      break_duration: 0,
    })
    .eq("id", bookingId)
    .select()
    .single();

  return { data, error };
};

/**
 * Check if break has expired and release seat if user is out of range
 * Called by the app after break timer expires
 */
export const checkBreakExpiry = async (bookingId, isInRange) => {
  requireSupabase();

  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("is_on_break", true)
    .single();

  if (findError || !booking) {
    return { released: false, error: findError };
  }

  // Check if break time has expired
  const breakEnd = new Date(booking.break_started_at);
  breakEnd.setMinutes(breakEnd.getMinutes() + (booking.break_duration || 30));

  if (new Date() > breakEnd) {
    if (isInRange) {
      // User is in range, just end the break
      await endBreak(bookingId);
      return { released: false, error: null };
    } else {
      // User is out of range, release the seat
      await completeBooking(bookingId, booking.seat_id);
      return { released: true, error: null };
    }
  }

  return { released: false, error: null };
};

/**
 * Release expired bookings (no-shows)
 * This can be called periodically or triggered by client
 */
export const releaseExpiredBooking = async (bookingId) => {
  requireSupabase();

  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("status", "pending")
    .eq("checked_in", false)
    .single();

  if (findError || !booking) {
    return { released: false, error: findError };
  }

  // Check if check-in deadline has passed
  if (
    booking.checkin_deadline &&
    new Date(booking.checkin_deadline) < new Date()
  ) {
    // Update booking to expired
    await supabase
      .from("bookings")
      .update({ status: "expired" })
      .eq("id", bookingId);

    // Release seat
    if (booking.seat_id) {
      await updateSeatStatus(booking.seat_id, "available");
    }

    // Ban user for 30 minutes
    await supabase
      .from("users")
      .update({
        booking_banned_until: new Date(
          Date.now() + 30 * 60 * 1000,
        ).toISOString(),
      })
      .eq("id", booking.user_id);

    return { released: true, error: null };
  }

  return { released: false, error: null };
};

// ============================================
// USERS API
// ============================================

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  requireSupabase();

  return await supabase.from("users").select("*").eq("id", userId).single();
};

/**
 * Update user points
 */
export const addUserPoints = async (userId, points) => {
  requireSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("points")
    .eq("id", userId)
    .single();

  if (user) {
    return await supabase
      .from("users")
      .update({ points: user.points + points })
      .eq("id", userId);
  }

  return { data: null, error: "User not found" };
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (limit = 10) => {
  requireSupabase();

  return await supabase
    .from("users")
    .select("id, name, points")
    .order("points", { ascending: false })
    .limit(limit);
};

// ============================================
// FOCUS SESSIONS API
// ============================================

/**
 * Record a completed focus session
 */
export const recordFocusSession = async (userId, duration, pointsEarned) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: userId,
      duration,
      points_earned: pointsEarned,
    })
    .select()
    .single();

  if (!error) {
    await addUserPoints(userId, pointsEarned);
  }

  return { data, error };
};

/**
 * Get user's focus session history
 */
export const getFocusSessions = async (userId, limit = 20) => {
  requireSupabase();

  return await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
};
