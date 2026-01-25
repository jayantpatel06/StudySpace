import * as Location from 'expo-location';

// Library locations for geofencing
// Add your library coordinates here
const LIBRARY_LOCATIONS = [
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
 * @returns {Promise<{inRange: boolean, nearestLibrary: object | null, distance: number | null}>}
 */
export const checkLibraryProximity = async () => {
    const location = await getCurrentLocation();

    if (!location) {
        return { inRange: false, nearestLibrary: null, distance: null, error: 'Location unavailable' };
    }

    let nearestLibrary = null;
    let minDistance = Infinity;

    for (const library of LIBRARY_LOCATIONS) {
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
 * @returns {Promise<{remove: function}>} Location subscription
 */
export const watchLocation = async (onLocationChange) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
        return null;
    }

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

            for (const library of LIBRARY_LOCATIONS) {
                const distance = calculateDistance(
                    coords.latitude,
                    coords.longitude,
                    library.latitude,
                    library.longitude
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestLibrary = library;
                }

                if (distance <= library.radiusMeters) {
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
 * Get library locations (for map display)
 */
export const getLibraryLocations = () => LIBRARY_LOCATIONS;

/**
 * Add a custom library location
 */
export const addLibraryLocation = (location) => {
    LIBRARY_LOCATIONS.push(location);
};
