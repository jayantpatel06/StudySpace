import { create } from "zustand";
import { supabase } from "../config/supabase";

export const useLibraryStore = create((set, get) => ({
  floors: [],
  rooms: [],
  seats: [],
  stats: null,
  activeStudents: [],
  isLoading: false,
  error: null,

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

      await get().fetchSeats(libraryId, roomId);
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
      const [seatsResult, bookingsResult, usersResult] = await Promise.all([
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
      ]);

      const seats = seatsResult.data || [];
      const todayBookings = bookingsResult.data || [];
      const activeBookings = usersResult.data || [];

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
