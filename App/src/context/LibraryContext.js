import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";
import { useAuth } from "./AuthContext";

const LibraryContext = createContext();

const SELECTED_LIBRARY_KEY = "@studysync_selected_library";

export const LibraryProvider = ({ children }) => {
  const { userInfo } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch libraries and selected library on mount
  useEffect(() => {
    loadSelectedLibrary();
  }, []);

  // Fetch subscribed libraries when user changes
  useEffect(() => {
    if (userInfo?.id) {
      fetchSubscribedLibraries();
    } else {
      setLibraries([]);
      setIsLoading(false);
    }
  }, [userInfo?.id]);

  // Sync selected library with database when user changes
  useEffect(() => {
    if (userInfo?.id && selectedLibrary) {
      syncSelectedLibraryToDatabase();
    }
  }, [userInfo?.id, selectedLibrary?.id]);

  // Filter libraries based on search query
  const filteredLibraries = useMemo(() => {
    if (!searchQuery.trim()) return libraries;
    const query = searchQuery.toLowerCase().trim();
    return libraries.filter(
      (lib) =>
        lib.name?.toLowerCase().includes(query) ||
        lib.address?.toLowerCase().includes(query)
    );
  }, [libraries, searchQuery]);

  // Fetch only libraries the user is subscribed to (with active, non-expired subscriptions)
  const fetchSubscribedLibraries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get the user's subscribed library IDs (active and not expired)
      const { data: subscriptions, error: subError } = await supabase
        .from("library_subscriptions")
        .select("library_id, expires_at")
        .eq("user_id", userInfo?.id)
        .eq("status", "active");

      if (subError) {
        console.error("Error fetching subscriptions:", subError);
        setError("Failed to load subscriptions");
        setLibraries([]);
        return;
      }

      if (!subscriptions || subscriptions.length === 0) {
        setLibraries([]);
        setIsLoading(false);
        return;
      }

      // Filter out expired subscriptions
      const now = new Date();
      const validSubscriptions = subscriptions.filter(
        (sub) => !sub.expires_at || new Date(sub.expires_at) > now
      );

      if (validSubscriptions.length === 0) {
        setLibraries([]);
        setIsLoading(false);
        return;
      }

      const libraryIds = validSubscriptions.map((sub) => sub.library_id);

      // Fetch the actual library details
      const { data, error: fetchError } = await supabase
        .from("libraries")
        .select("*")
        .in("id", libraryIds)
        .eq("is_active", true)
        .order("name");

      if (fetchError) {
        console.error("Error fetching libraries:", fetchError);
        setError("Failed to load libraries");
        return;
      }

      // Debug: log what we get from database
      if (data && data.length > 0) {
        data.forEach((lib) => {
          console.log(
            `[LibraryContext] "${lib.name}" - radius_meters:`,
            lib.radius_meters,
            "type:",
            typeof lib.radius_meters,
          );
        });
      }

      setLibraries(data || []);
    } catch (err) {
      console.error("Fetch libraries error:", err);
      setError("Failed to load libraries");
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy function for backward compatibility
  const fetchLibraries = async () => {
    if (userInfo?.id) {
      return fetchSubscribedLibraries();
    }
    setLibraries([]);
  };

  const loadSelectedLibrary = async () => {
    try {
      const stored = await AsyncStorage.getItem(SELECTED_LIBRARY_KEY);
      if (stored) {
        setSelectedLibrary(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading selected library:", error);
    }
  };

  const syncSelectedLibraryToDatabase = async () => {
    // Use Supabase user ID (numeric) for database relations
    const supabaseUserId = userInfo?.id;
    const authId = userInfo?.authId;

    if (!supabaseUserId || !selectedLibrary?.id) return;

    try {
      // Upsert user's selected library
      await supabase.from("user_selected_library").upsert(
        {
          user_id: supabaseUserId,
          auth_id: authId,
          library_id: selectedLibrary.id,
          selected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );
    } catch (error) {
      console.error("Error syncing selected library:", error);
    }
  };

  const selectLibrary = useCallback(async (library) => {
    try {
      setSelectedLibrary(library);
      await AsyncStorage.setItem(SELECTED_LIBRARY_KEY, JSON.stringify(library));
    } catch (error) {
      console.error("Error saving selected library:", error);
    }
  }, []);

  const clearSelectedLibrary = useCallback(async () => {
    try {
      setSelectedLibrary(null);
      await AsyncStorage.removeItem(SELECTED_LIBRARY_KEY);

      // Use Supabase user ID for database operations
      const supabaseUserId = userInfo?.id;
      if (supabaseUserId) {
        await supabase
          .from("user_selected_library")
          .delete()
          .eq("user_id", supabaseUserId);
      }
    } catch (error) {
      console.error("Error clearing selected library:", error);
    }
  }, [userInfo?.id]);

  const getLibraryById = useCallback(
    (libraryId) => {
      return libraries.find((lib) => lib.id === libraryId);
    },
    [libraries],
  );

  // Check if user is within selected library's geofence
  const isWithinSelectedLibrary = useCallback(
    (userLatitude, userLongitude) => {
      if (!selectedLibrary) return false;

      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        parseFloat(selectedLibrary.latitude),
        parseFloat(selectedLibrary.longitude),
      );

      return distance <= selectedLibrary.radius_meters;
    },
    [selectedLibrary],
  );

  return (
    <LibraryContext.Provider
      value={{
        libraries,
        filteredLibraries,
        selectedLibrary,
        isLoading,
        error,
        searchQuery,
        setSearchQuery,
        fetchLibraries,
        fetchSubscribedLibraries,
        selectLibrary,
        clearSelectedLibrary,
        getLibraryById,
        isWithinSelectedLibrary,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useLibrary = () => useContext(LibraryContext);
