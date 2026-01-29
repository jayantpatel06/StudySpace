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
export const createBooking = async (userId, seatId, duration, location) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      seat_id: seatId,
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
    .update({ status: "completed" })
    .eq("id", bookingId)
    .select()
    .single();

  if (!error && seatId) {
    await updateSeatStatus(seatId, "available");
  }

  return { data, error };
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
