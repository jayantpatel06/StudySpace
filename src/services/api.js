import { supabase, isSupabaseConfigured } from '../config/supabase';

// Helper to ensure Supabase is configured
const requireSupabase = () => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured. Please add your credentials to src/config/supabase.js');
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

    let query = supabase.from('seats').select('*');
    if (floor) {
        query = query.eq('floor', floor);
    }
    return await query.order('id');
};

/**
 * Get heatmap data for the seat map
 */
export const getSeatHeatmap = async (floor = 1) => {
    requireSupabase();

    const { data, error } = await supabase
        .from('seats')
        .select('id, label, status, floor, zone, has_power, is_quiet_zone')
        .eq('floor', floor);

    return { data, error };
};

/**
 * Get single seat details
 */
export const getSeatById = async (seatId) => {
    requireSupabase();

    return await supabase
        .from('seats')
        .select('*')
        .eq('id', seatId)
        .single();
};

/**
 * Update seat status (used internally when bookings change)
 */
export const updateSeatStatus = async (seatId, status) => {
    requireSupabase();

    return await supabase
        .from('seats')
        .update({ status })
        .eq('id', seatId);
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
        .from('bookings')
        .insert({
            user_id: userId,
            seat_id: seatId,
            start_time: new Date().toISOString(),
            duration,
            location,
            status: 'pending',
            checked_in: false,
        })
        .select()
        .single();

    if (!error && data) {
        await updateSeatStatus(seatId, 'reserved');
    }

    return { data, error };
};

/**
 * Get active booking for a user
 */
export const getActiveBooking = async (userId) => {
    requireSupabase();

    return await supabase
        .from('bookings')
        .select('*, seats(*)')
        .eq('user_id', userId)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
};

/**
 * Get booking history for a user
 */
export const getBookingHistory = async (userId, limit = 10) => {
    requireSupabase();

    return await supabase
        .from('bookings')
        .select('*, seats(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
};

/**
 * Check in to a booking
 */
export const checkInBooking = async (bookingId, seatId) => {
    requireSupabase();

    const { data, error } = await supabase
        .from('bookings')
        .update({ checked_in: true, status: 'active' })
        .eq('id', bookingId)
        .select()
        .single();

    if (!error && seatId) {
        await updateSeatStatus(seatId, 'occupied');
    }

    return { data, error };
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId, seatId) => {
    requireSupabase();

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

    if (!error && seatId) {
        await updateSeatStatus(seatId, 'available');
    }

    return { data, error };
};

/**
 * Complete a booking (checkout)
 */
export const completeBooking = async (bookingId, seatId) => {
    requireSupabase();

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId)
        .select()
        .single();

    if (!error && seatId) {
        await updateSeatStatus(seatId, 'available');
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

    return await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
};

/**
 * Update user points
 */
export const addUserPoints = async (userId, points) => {
    requireSupabase();

    const { data: user } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

    if (user) {
        return await supabase
            .from('users')
            .update({ points: user.points + points })
            .eq('id', userId);
    }

    return { data: null, error: 'User not found' };
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (limit = 10) => {
    requireSupabase();

    return await supabase
        .from('users')
        .select('id, name, points')
        .order('points', { ascending: false })
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
        .from('focus_sessions')
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
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
};
