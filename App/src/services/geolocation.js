import * as Location from 'expo-location';
import { supabase } from '../config/supabase';

// Library locations for geofencing (fallback if database fails)
let LIBRARY_LOCATIONS = [
    {
        id: 'main_library',
        name: 'Main Library',
        latitude: 28.6139,  // Example: Delhi coordinates
        longitude: 77.2090,
        radiusMeters: 100,  // 100 meter radius
    },
    {
        id: 'science_library',
        name: 'Science Library',
        latitude: 28.6145,
        longitude: 77.2095,
        radiusMeters: 50,
    },
];

// Cache for database libraries
let cachedLibraries = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch libraries from database
 */
export const fetchLibrariesFromDB = async () => {
    try {
        // Check cache
        if (cachedLibraries && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            return cachedLibraries;
        }

        const { data, error } = await supabase
            .from('libraries')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching libraries:', error);
            return LIBRARY_LOCATIONS; // Return fallback
        }

        if (data && data.length > 0) {
            // Transform to match expected format
            cachedLibraries = data.map(lib => ({
                id: lib.id.toString(),
                name: lib.name,
                latitude: parseFloat(lib.latitude),
                longitude: parseFloat(lib.longitude),
                radiusMeters: lib.radius_meters || 100,
                address: lib.address,
                totalSeats: lib.total_seats,
            }));
            cacheTimestamp = Date.now();
            return cachedLibraries;
        }

        return LIBRARY_LOCATIONS;
    } catch (error) {
        console.error('Error in fetchLibrariesFromDB:', error);
        return LIBRARY_LOCATIONS;
    }
};

/**
 * Request location permissions
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestLocationPermission = async () => {
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

        if (foregroundStatus !== 'granted') {
            console.log('Foreground location permission denied');
            return false;
        }

        // Optionally request background permission for geofencing
        // const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        return true;
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return false;
    }
};

/**
 * Get current location
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCurrentLocation = async () => {
    try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Check if user is within any library geofence
 * @param {object} selectedLibrary - Optional: check against a specific library
 * @returns {Promise<{inRange: boolean, nearestLibrary: object | null, distance: number | null}>}
 */
export const checkLibraryProximity = async (selectedLibrary = null) => {
    const location = await getCurrentLocation();

    if (!location) {
        return { inRange: false, nearestLibrary: null, distance: null, error: 'Location unavailable' };
    }

    // If a specific library is selected, check only against that
    if (selectedLibrary) {
        const distance = calculateDistance(
            location.latitude,
            location.longitude,
            parseFloat(selectedLibrary.latitude),
            parseFloat(selectedLibrary.longitude)
        );
        
        const radiusMeters = selectedLibrary.radius_meters || selectedLibrary.radiusMeters || 100;
        const inRange = distance <= radiusMeters;

        return {
            inRange,
            nearestLibrary: selectedLibrary,
            distance: Math.round(distance),
            userLocation: location,
        };
    }

    // Otherwise check against all libraries
    const libraries = await fetchLibrariesFromDB();
    
    let nearestLibrary = null;
    let minDistance = Infinity;

    for (const library of libraries) {
        const distance = calculateDistance(
            location.latitude,
            location.longitude,
            library.latitude,
            library.longitude
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestLibrary = library;
        }
    }

    const inRange = nearestLibrary && minDistance <= nearestLibrary.radiusMeters;

    return {
        inRange,
        nearestLibrary,
        distance: Math.round(minDistance),
        userLocation: location,
    };
};

/**
 * Start watching location for real-time updates
 * @param {function} onLocationChange - Callback when location changes
 * @param {object} selectedLibrary - Optional: watch against a specific library
 * @returns {Promise<{remove: function}>} Location subscription
 */
export const watchLocation = async (onLocationChange, selectedLibrary = null) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
        return null;
    }

    // Fetch libraries for proximity check
    const libraries = selectedLibrary ? [selectedLibrary] : await fetchLibrariesFromDB();

    return await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,  // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
        },
        (location) => {
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            // Check proximity to libraries
            let inRange = false;
            let nearestLibrary = null;
            let minDistance = Infinity;

            for (const library of libraries) {
                const lat = parseFloat(library.latitude);
                const lng = parseFloat(library.longitude);
                const radius = library.radius_meters || library.radiusMeters || 100;

                const distance = calculateDistance(
                    coords.latitude,
                    coords.longitude,
                    lat,
                    lng
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestLibrary = library;
                }

                if (distance <= radius) {
                    inRange = true;
                }
            }

            onLocationChange({
                ...coords,
                inRange,
                nearestLibrary,
                distance: Math.round(minDistance),
            });
        }
    );
};

/**
 * Get library locations (from database or fallback)
 */
export const getLibraryLocations = async () => {
    return await fetchLibrariesFromDB();
};

/**
 * Add a custom library location
 */
export const addLibraryLocation = (location) => {
    LIBRARY_LOCATIONS.push(location);
};
