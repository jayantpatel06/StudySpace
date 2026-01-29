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
// LIBRARIES API
// ============================================

/**
 * Get all libraries
 * @param {boolean} activeOnly - Only return active libraries
 */
export const getLibraries = async (activeOnly = true) => {
  requireSupabase();

  let query = supabase.from("libraries").select("*");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  return await query.order("name");
};

/**
 * Get library by ID
 */
export const getLibraryById = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("libraries")
    .select("*")
    .eq("id", libraryId)
    .single();
};

/**
 * Create a new library
 */
export const createLibrary = async (libraryData) => {
  requireSupabase();

  const { data, error } = await supabase
    .from("libraries")
    .insert({
      name: libraryData.name,
      address: libraryData.address,
      latitude: libraryData.latitude,
      longitude: libraryData.longitude,
      radius_meters: libraryData.radiusMeters || 100,
      opening_time: libraryData.openingTime || "08:00:00",
      closing_time: libraryData.closingTime || "22:00:00",
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
    .from("libraries")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", libraryId)
    .select()
    .single();
};

/**
 * Delete a library (soft delete by setting is_active to false)
 */
export const deleteLibrary = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("libraries")
    .update({ is_active: false })
    .eq("id", libraryId);
};

/**
 * Permanently delete a library
 */
export const permanentlyDeleteLibrary = async (libraryId) => {
  requireSupabase();

  return await supabase.from("libraries").delete().eq("id", libraryId);
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
    .from("admins")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();
};

/**
 * Update admin password
 */
export const updateAdminPassword = async (adminId, passwordHash) => {
  requireSupabase();

  return await supabase
    .from("admins")
    .update({
      password_hash: passwordHash,
      is_default_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
};

/**
 * Create a new admin
 */
export const createAdmin = async (adminData) => {
  requireSupabase();

  return await supabase
    .from("admins")
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

  let query = supabase.from("seats").select("*").eq("library_id", libraryId);

  if (floor) {
    query = query.eq("floor", floor);
  }

  return await query.order("id");
};

/**
 * Create seats for a library
 */
export const createSeatsForLibrary = async (libraryId, seats) => {
  requireSupabase();

  const seatsWithLibrary = seats.map((seat) => ({
    ...seat,
    library_id: libraryId,
  }));

  return await supabase.from("seats").insert(seatsWithLibrary).select();
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
    supabase.from("seats").select("status").eq("library_id", libraryId),
    supabase
      .from("bookings")
      .select("status")
      .eq("library_id", libraryId)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ),
  ]);

  const seats = seatsResult.data || [];
  const bookings = bookingsResult.data || [];

  return {
    totalSeats: seats.length,
    availableSeats: seats.filter((s) => s.status === "available").length,
    occupiedSeats: seats.filter((s) => s.status === "occupied").length,
    reservedSeats: seats.filter((s) => s.status === "reserved").length,
    todayBookings: bookings.length,
    activeBookings: bookings.filter((b) => b.status === "active").length,
  };
};

/**
 * Get overall admin dashboard statistics
 */
export const getDashboardStats = async () => {
  requireSupabase();

  const [librariesResult, seatsResult, usersResult, bookingsResult] =
    await Promise.all([
      supabase
        .from("libraries")
        .select("id", { count: "exact" })
        .eq("is_active", true),
      supabase.from("seats").select("status"),
      supabase.from("users").select("id", { count: "exact" }),
      supabase
        .from("bookings")
        .select("status")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

  const seats = seatsResult.data || [];
  const bookings = bookingsResult.data || [];

  return {
    totalLibraries: librariesResult.count || 0,
    totalSeats: seats.length,
    availableSeats: seats.filter((s) => s.status === "available").length,
    totalUsers: usersResult.count || 0,
    todayBookings: bookings.length,
    activeBookings: bookings.filter((b) => b.status === "active").length,
  };
};

// ============================================
// LIBRARY CLIENT CREDENTIALS API
// ============================================

/**
 * Generate unique username for a library client
 */
const generateUsername = (libraryName) => {
  const prefix = libraryName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 8);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${randomSuffix}`;
};

/**
 * Generate random password
 */
const generatePassword = (length = 12) => {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Simple password hashing (in production, use bcrypt)
 * This is a placeholder - implement proper hashing on backend
 */
const hashPassword = (password) => {
  // In production, this should be done server-side with bcrypt
  // For now, we'll use a simple approach (NOT SECURE for production)
  return btoa(password); // Base64 encoding - REPLACE WITH BCRYPT
};

/**
 * Create client credentials for a library
 */
export const createLibraryClient = async (
  libraryId,
  libraryName,
  adminId,
  clientData = {},
) => {
  requireSupabase();

  const username = clientData.username || generateUsername(libraryName);
  const password = clientData.password || generatePassword();
  const passwordHash = hashPassword(password);

  const { data, error } = await supabase
    .from("library_clients")
    .insert({
      library_id: libraryId,
      username: username,
      password_hash: passwordHash,
      name: clientData.name || `${libraryName} Owner`,
      email: clientData.email,
      phone: clientData.phone,
      is_active: true,
      created_by: adminId,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error, credentials: null };
  }

  // Return credentials for admin to share with client
  return {
    data,
    error: null,
    credentials: {
      username,
      password, // Only returned once at creation
      libraryId,
      libraryName,
    },
  };
};

/**
 * Get all library clients
 */
export const getLibraryClients = async () => {
  requireSupabase();

  return await supabase
    .from("library_clients")
    .select(
      `
            *,
            library:libraries(id, name),
            created_by_admin:admins(name, email)
        `,
    )
    .order("created_at", { ascending: false });
};

/**
 * Get client by library ID
 */
export const getClientByLibraryId = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("library_clients")
    .select("*")
    .eq("library_id", libraryId)
    .single();
};

/**
 * Update client credentials
 */
export const updateLibraryClient = async (clientId, updates) => {
  requireSupabase();

  const updateData = { ...updates };

  // If password is being updated, hash it
  if (updates.password) {
    updateData.password_hash = hashPassword(updates.password);
    delete updateData.password;
  }

  return await supabase
    .from("library_clients")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select()
    .single();
};

/**
 * Reset client password
 */
export const resetClientPassword = async (clientId) => {
  requireSupabase();

  const newPassword = generatePassword();
  const passwordHash = hashPassword(newPassword);

  const { data, error } = await supabase
    .from("library_clients")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select()
    .single();

  return {
    data,
    error,
    newPassword: error ? null : newPassword,
  };
};

/**
 * Deactivate/activate client
 */
export const toggleClientStatus = async (clientId, isActive) => {
  requireSupabase();

  return await supabase
    .from("library_clients")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select()
    .single();
};

/**
 * Delete client
 */
export const deleteLibraryClient = async (clientId) => {
  requireSupabase();

  return await supabase.from("library_clients").delete().eq("id", clientId);
};

// ============================================
// FLOOR MANAGEMENT
// ============================================

/**
 * Get all floors for a library
 */
export const getFloorsByLibrary = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("floors")
    .select("*")
    .eq("library_id", libraryId)
    .eq("is_active", true)
    .order("floor_number", { ascending: true });
};

/**
 * Create a new floor
 */
export const createFloor = async (floorData) => {
  requireSupabase();

  return await supabase.from("floors").insert(floorData).select().single();
};

/**
 * Update a floor
 */
export const updateFloor = async (floorId, updates) => {
  requireSupabase();

  return await supabase
    .from("floors")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", floorId)
    .select()
    .single();
};

/**
 * Delete a floor (and cascade to rooms and seats)
 */
export const deleteFloor = async (floorId) => {
  requireSupabase();

  return await supabase.from("floors").delete().eq("id", floorId);
};

// ============================================
// ROOM MANAGEMENT
// ============================================

/**
 * Get all rooms for a floor
 */
export const getRoomsByFloor = async (floorId) => {
  requireSupabase();

  return await supabase
    .from("rooms")
    .select("*")
    .eq("floor_id", floorId)
    .eq("is_active", true)
    .order("room_name", { ascending: true });
};

/**
 * Get all rooms for a library
 */
export const getRoomsByLibrary = async (libraryId) => {
  requireSupabase();

  return await supabase
    .from("rooms")
    .select(
      `
            *,
            floor:floors(id, floor_number, floor_name)
        `,
    )
    .eq("library_id", libraryId)
    .eq("is_active", true)
    .order("room_name", { ascending: true });
};

/**
 * Create a new room
 */
export const createRoom = async (roomData) => {
  requireSupabase();

  return await supabase.from("rooms").insert(roomData).select().single();
};

/**
 * Update a room
 */
export const updateRoom = async (roomId, updates) => {
  requireSupabase();

  return await supabase
    .from("rooms")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .select()
    .single();
};

/**
 * Delete a room (and cascade to seats)
 */
export const deleteRoom = async (roomId) => {
  requireSupabase();

  return await supabase.from("rooms").delete().eq("id", roomId);
};

// ============================================
// SEAT MANAGEMENT
// ============================================

/**
 * Get all seats for a room
 */
export const getSeatsByRoom = async (roomId) => {
  requireSupabase();

  return await supabase
    .from("seats")
    .select("*")
    .eq("room_id", roomId)
    .eq("is_active", true)
    .order("row_number", { ascending: true })
    .order("column_number", { ascending: true });
};

/**
 * Create multiple seats in a grid pattern
 */
export const createSeats = async (roomId, libraryId, rows, columns) => {
  requireSupabase();

  const seats = [];
  let seatNumber = 1;

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= columns; col++) {
      seats.push({
        room_id: roomId,
        library_id: libraryId,
        seat_number: seatNumber,
        row_number: row,
        column_number: col,
        status: "available",
        is_active: true,
      });
      seatNumber++;
    }
  }

  return await supabase.from("seats").insert(seats).select();
};

/**
 * Update seat status
 */
export const updateSeatStatus = async (seatId, status) => {
  requireSupabase();

  return await supabase
    .from("seats")
    .update({ status })
    .eq("id", seatId)
    .select()
    .single();
};

/**
 * Delete a seat
 */
export const deleteSeat = async (seatId) => {
  requireSupabase();

  return await supabase
    .from("seats")
    .update({ is_active: false })
    .eq("id", seatId);
};
