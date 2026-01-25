import { supabase, isSupabaseConfigured } from '../config/supabase';

// Helper to ensure Supabase is configured
const requireSupabase = () => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured. Please add your credentials to src/config/supabase.js');
    }
};

// ============================================
// LIBRARIES API
// ============================================

/**
 * Get all libraries
 * @param {boolean} activeOnly - Only return active libraries
 */
export const getLibraries = async (activeOnly = true) => {
    requireSupabase();

    let query = supabase.from('libraries').select('*');
    
    if (activeOnly) {
        query = query.eq('is_active', true);
    }
    
    return await query.order('name');
};

/**
 * Get library by ID
 */
export const getLibraryById = async (libraryId) => {
    requireSupabase();

    return await supabase
        .from('libraries')
        .select('*')
        .eq('id', libraryId)
        .single();
};

/**
 * Create a new library
 */
export const createLibrary = async (libraryData) => {
    requireSupabase();

    const { data, error } = await supabase
        .from('libraries')
        .insert({
            name: libraryData.name,
            address: libraryData.address,
            latitude: libraryData.latitude,
            longitude: libraryData.longitude,
            radius_meters: libraryData.radiusMeters || 100,
            opening_time: libraryData.openingTime || '08:00:00',
            closing_time: libraryData.closingTime || '22:00:00',
            total_seats: libraryData.totalSeats || 0,
            description: libraryData.description,
            image_url: libraryData.imageUrl,
            created_by: libraryData.createdBy,
            is_active: true,
        })
        .select()
        .single();

    return { data, error };
};

/**
 * Update a library
 */
export const updateLibrary = async (libraryId, updates) => {
    requireSupabase();

    return await supabase
        .from('libraries')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', libraryId)
        .select()
        .single();
};

/**
 * Delete a library (soft delete by setting is_active to false)
 */
export const deleteLibrary = async (libraryId) => {
    requireSupabase();

    return await supabase
        .from('libraries')
        .update({ is_active: false })
        .eq('id', libraryId);
};

/**
 * Permanently delete a library
 */
export const permanentlyDeleteLibrary = async (libraryId) => {
    requireSupabase();

    return await supabase
        .from('libraries')
        .delete()
        .eq('id', libraryId);
};

// ============================================
// ADMIN API
// ============================================

/**
 * Get admin by email
 */
export const getAdminByEmail = async (email) => {
    requireSupabase();

    return await supabase
        .from('admins')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
};

/**
 * Update admin password
 */
export const updateAdminPassword = async (adminId, passwordHash) => {
    requireSupabase();

    return await supabase
        .from('admins')
        .update({
            password_hash: passwordHash,
            is_default_password: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', adminId);
};

/**
 * Create a new admin
 */
export const createAdmin = async (adminData) => {
    requireSupabase();

    return await supabase
        .from('admins')
        .insert({
            email: adminData.email.toLowerCase().trim(),
            password_hash: adminData.passwordHash,
            name: adminData.name,
            is_default_password: false,
        })
        .select()
        .single();
};

// ============================================
// SEATS BY LIBRARY API
// ============================================

/**
 * Get seats for a specific library
 */
export const getSeatsByLibrary = async (libraryId, floor = null) => {
    requireSupabase();

    let query = supabase
        .from('seats')
        .select('*')
        .eq('library_id', libraryId);

    if (floor) {
        query = query.eq('floor', floor);
    }

    return await query.order('id');
};

/**
 * Create seats for a library
 */
export const createSeatsForLibrary = async (libraryId, seats) => {
    requireSupabase();

    const seatsWithLibrary = seats.map(seat => ({
        ...seat,
        library_id: libraryId,
    }));

    return await supabase
        .from('seats')
        .insert(seatsWithLibrary)
        .select();
};

// ============================================
// STATISTICS API
// ============================================

/**
 * Get library statistics
 */
export const getLibraryStats = async (libraryId) => {
    requireSupabase();

    const [seatsResult, bookingsResult] = await Promise.all([
        supabase
            .from('seats')
            .select('status')
            .eq('library_id', libraryId),
        supabase
            .from('bookings')
            .select('status')
            .eq('library_id', libraryId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const seats = seatsResult.data || [];
    const bookings = bookingsResult.data || [];

    return {
        totalSeats: seats.length,
        availableSeats: seats.filter(s => s.status === 'available').length,
        occupiedSeats: seats.filter(s => s.status === 'occupied').length,
        reservedSeats: seats.filter(s => s.status === 'reserved').length,
        todayBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'active').length,
    };
};

/**
 * Get overall admin dashboard statistics
 */
export const getDashboardStats = async () => {
    requireSupabase();

    const [librariesResult, seatsResult, usersResult, bookingsResult] = await Promise.all([
        supabase.from('libraries').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('seats').select('status'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase
            .from('bookings')
            .select('status')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const seats = seatsResult.data || [];
    const bookings = bookingsResult.data || [];

    return {
        totalLibraries: librariesResult.count || 0,
        totalSeats: seats.length,
        availableSeats: seats.filter(s => s.status === 'available').length,
        totalUsers: usersResult.count || 0,
        todayBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'active').length,
    };
};
