import { create } from "zustand";
import { supabase } from "../config/supabase";

export const useLibraryStore = create((set, get) => ({
  floors: [],
  rooms: [],
  seats: [],
  stats: null,
  activeStudents: [],
  subscribedStudents: [],
  isLoading: false,
  error: null,

  // Fetch subscribed students for a library
  fetchSubscribedStudents: async (libraryId) => {
    try {
      const { data, error } = await supabase
        .from("library_subscriptions")
        .select(`
          *,
          user:users(id, name, email, department, avatar_url, student_code)
        `)
        .eq("library_id", libraryId)
        .order("subscribed_at", { ascending: false });

      if (error) throw error;

      set({ subscribedStudents: data || [] });
      return data;
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },

  // Add student subscription by student code
  addStudentSubscription: async (libraryId, studentCode, clientId, notes = "", expiresAt = null) => {
    try {
      // First, find the user by student code
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("student_code", studentCode)
        .single();

      if (userError || !user) {
        return { data: null, error: "Student not found with this code" };
      }

      // Check if already subscribed (use maybeSingle to avoid error when no rows found)
      const { data: existing, error: existingError } = await supabase
        .from("library_subscriptions")
        .select("id, status, expires_at")
        .eq("user_id", user.id)
        .eq("library_id", libraryId)
        .maybeSingle();

      if (existingError) {
        return { data: null, error: existingError.message };
      }

      if (existing) {
        // Check if subscription is currently active and not expired
        const isExpired = existing.expires_at && new Date(existing.expires_at) < new Date();
        const isActive = existing.status === "active" && !isExpired;

        if (isActive) {
          return { data: null, error: "Student is already subscribed to this library" };
        }
        
        // Reactivate the subscription (expired or cancelled)
        const { data, error } = await supabase
          .from("library_subscriptions")
          .update({
            status: "active",
            subscription_code: studentCode,
            notes,
            expires_at: expiresAt,
            subscribed_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select(`
            *,
            user:users(id, name, email, department, avatar_url, student_code)
          `)
          .single();

        if (error) throw error;

        const { subscribedStudents } = get();
        set({
          subscribedStudents: subscribedStudents.map((s) =>
            s.id === existing.id ? data : s
          ),
        });
        return { data, error: null };
      }

      // Create new subscription
      const { data, error } = await supabase
        .from("library_subscriptions")
        .insert({
          user_id: user.id,
          library_id: libraryId,
          subscription_code: studentCode,
          status: "active",
          created_by: clientId,
          notes,
          expires_at: expiresAt,
        })
        .select(`
          *,
          user:users(id, name, email, department, avatar_url, student_code)
        `)
        .single();

      if (error) throw error;

      const { subscribedStudents } = get();
      set({ subscribedStudents: [data, ...subscribedStudents] });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Remove student subscription
  removeStudentSubscription: async (subscriptionId) => {
    try {
      const { error } = await supabase
        .from("library_subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscriptionId);

      if (error) throw error;

      const { subscribedStudents } = get();
      set({
        subscribedStudents: subscribedStudents.map((s) =>
          s.id === subscriptionId ? { ...s, status: "cancelled" } : s
        ),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Subscribe to real-time subscription updates
  subscribeToSubscriptions: (libraryId) => {
    const channel = supabase
      .channel("subscriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_subscriptions",
          filter: `library_id=eq.${libraryId}`,
        },
        async (payload) => {
          // Refetch to get the joined user data
          const { fetchSubscribedStudents } = get();
          await fetchSubscribedStudents(libraryId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Fetch all floors for a library
  fetchFloors: async (libraryId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("floors")
        .select("*")
        .eq("library_id", libraryId)
        .eq("is_active", true)
        .order("floor_number");

      if (error) throw error;
      set({ floors: data || [], isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Fetch rooms for a specific floor
  fetchRooms: async (libraryId, floorId = null) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from("rooms")
        .select("*, floor:floors(floor_number, floor_name)")
        .eq("library_id", libraryId)
        .eq("is_active", true);

      if (floorId) {
        query = query.eq("floor_id", floorId);
      }

      const { data, error } = await query.order("room_name");

      if (error) throw error;
      set({ rooms: data || [], isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Fetch seats for a specific room
  fetchSeats: async (libraryId, roomId = null) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from("seats")
        .select("*, room:rooms(room_name, floor_id)")
        .eq("library_id", libraryId);

      if (roomId) {
        query = query.eq("room_id", roomId);
      }

      const { data, error } = await query
        .order("row_number")
        .order("column_number");

      if (error) throw error;
      set({ seats: data || [], isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  // Add a new floor
  addFloor: async (libraryId, floorData) => {
    try {
      const { data, error } = await supabase
        .from("floors")
        .insert({
          library_id: libraryId,
          floor_number: floorData.floor_number,
          floor_name: floorData.floor_name || `Floor ${floorData.floor_number}`,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const { floors } = get();
      set({
        floors: [...floors, data].sort(
          (a, b) => a.floor_number - b.floor_number,
        ),
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Add a new room
  addRoom: async (libraryId, floorId, roomData) => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          library_id: libraryId,
          floor_id: floorId,
          room_name: roomData.room_name,
          room_code: roomData.room_code,
          room_type: roomData.room_type || "Study Hall",
          capacity: roomData.capacity || 0,
          is_active: true,
        })
        .select("*, floor:floors(floor_number, floor_name)")
        .single();

      if (error) throw error;

      const { rooms } = get();
      set({ rooms: [...rooms, data] });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Create seats for a room (generate seat matrix)
  createSeatsForRoom: async (
    libraryId,
    roomId,
    rows,
    columns,
    options = {},
  ) => {
    try {
      const seats = [];
      const {
        hasPower = false,
        isQuietZone = false,
        hasLamp = false,
        hasErgoChair = false,
        hasWifi = false,
        wifiSpeed = null,
        roomCode = "",
      } = options;

      for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= columns; col++) {
          const rowLabel = String.fromCharCode(64 + row); // A, B, C...
          const seatId = `${roomCode}${rowLabel}${col}`;
          seats.push({
            id: seatId,
            label: `${rowLabel}${col}`,
            library_id: libraryId,
            room_id: roomId,
            row_number: row,
            column_number: col,
            seat_number: (row - 1) * columns + col,
            floor: options.floor || 1,
            zone: options.zone || "General",
            has_power: hasPower,
            is_quiet_zone: isQuietZone,
            has_lamp: hasLamp,
            has_ergo_chair: hasErgoChair,
            has_wifi: hasWifi,
            wifi_speed: hasWifi ? wifiSpeed : null,
            status: "available",
            is_active: true,
          });
        }
      }

      const { data, error } = await supabase
        .from("seats")
        .upsert(seats, { onConflict: "id" })
        .select();

      if (error) throw error;

      // Update room capacity
      await supabase
        .from("rooms")
        .update({ capacity: rows * columns })
        .eq("id", roomId);

      // Merge new seats with existing seats (instead of replacing all)
      // First, remove any old seats for this room, then add the new ones
      const existingSeats = get().seats;
      const seatsFromOtherRooms = existingSeats.filter(s => s.room_id !== roomId);
      set({ seats: [...seatsFromOtherRooms, ...data] });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Update seat status
  updateSeatStatus: async (seatId, status) => {
    try {
      const { data, error } = await supabase
        .from("seats")
        .update({ status })
        .eq("id", seatId)
        .select()
        .single();

      if (error) throw error;

      const { seats } = get();
      set({ seats: seats.map((s) => (s.id === seatId ? data : s)) });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Toggle seat active status
  toggleSeatActive: async (seatId, isActive) => {
    try {
      const { data, error } = await supabase
        .from("seats")
        .update({ is_active: isActive })
        .eq("id", seatId)
        .select()
        .single();

      if (error) throw error;

      const { seats } = get();
      set({ seats: seats.map((s) => (s.id === seatId ? data : s)) });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Delete a floor (cascade deletes rooms and seats)
  deleteFloor: async (floorId) => {
    try {
      const { error } = await supabase
        .from("floors")
        .delete()
        .eq("id", floorId);

      if (error) throw error;

      const { floors } = get();
      set({ floors: floors.filter((f) => f.id !== floorId) });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Delete a room (cascade deletes seats)
  deleteRoom: async (roomId) => {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) throw error;

      const { rooms } = get();
      set({ rooms: rooms.filter((r) => r.id !== roomId) });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Fetch library stats
  fetchStats: async (libraryId) => {
    try {
      const [seatsResult, bookingsResult, usersResult, subscriptionsResult] = await Promise.all([
        supabase
          .from("seats")
          .select("status, is_active")
          .eq("library_id", libraryId),
        supabase
          .from("bookings")
          .select("status, checked_in, user_id")
          .eq("library_id", libraryId)
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ),
        supabase
          .from("bookings")
          .select("user_id")
          .eq("library_id", libraryId)
          .eq("status", "active")
          .eq("checked_in", true),
        supabase
          .from("library_subscriptions")
          .select("id, status, expires_at")
          .eq("library_id", libraryId),
      ]);

      const seats = seatsResult.data || [];
      const todayBookings = bookingsResult.data || [];
      const activeBookings = usersResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      // Count active subscriptions (status=active AND not expired)
      const now = new Date();
      const activeSubscriptions = subscriptions.filter(
        (s) => s.status === "active" && (!s.expires_at || new Date(s.expires_at) > now)
      );

      const stats = {
        totalSeats: seats.filter((s) => s.is_active !== false).length,
        availableSeats: seats.filter(
          (s) => s.status === "available" && s.is_active !== false,
        ).length,
        occupiedSeats: seats.filter(
          (s) => s.status === "occupied" && s.is_active !== false,
        ).length,
        reservedSeats: seats.filter(
          (s) => s.status === "reserved" && s.is_active !== false,
        ).length,
        todayBookings: todayBookings.length,
        checkedInUsers: activeBookings.length,
        subscribedStudents: activeSubscriptions.length,
        totalSubscriptions: subscriptions.length,
        occupancyRate:
          seats.length > 0
            ? Math.round(
              (seats.filter((s) => s.status === "occupied").length /
                seats.filter((s) => s.is_active !== false).length) *
              100,
            )
            : 0,
      };

      set({ stats });
      return stats;
    } catch (error) {
      set({ error: error.message });
      return null;
    }
  },

  // Fetch active students (checked in users)
  fetchActiveStudents: async (libraryId) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          user:users(id, name, email, department, avatar_url),
          seat:seats(id, label, room_id)
        `,
        )
        .eq("library_id", libraryId)
        .eq("status", "active")
        .eq("checked_in", true)
        .order("start_time", { ascending: false });

      if (error) throw error;

      set({ activeStudents: data || [] });
      return data;
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },

  // Subscribe to real-time seat updates
  subscribeToSeats: (libraryId) => {
    const channel = supabase
      .channel("seats-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seats",
          filter: `library_id=eq.${libraryId}`,
        },
        (payload) => {
          const { seats } = get();
          if (payload.eventType === "INSERT") {
            set({ seats: [...seats, payload.new] });
          } else if (payload.eventType === "UPDATE") {
            set({
              seats: seats.map((s) =>
                s.id === payload.new.id ? payload.new : s,
              ),
            });
          } else if (payload.eventType === "DELETE") {
            set({ seats: seats.filter((s) => s.id !== payload.old.id) });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  clearError: () => {
    set({ error: null });
  },
}));
