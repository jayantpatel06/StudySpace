import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
    requestLocationPermission,
    checkLibraryProximity,
    watchLocation,
    getCurrentLocation,
    getLibraryLocations
} from '../services/geolocation';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    // Location state
    const [locationStatus, setLocationStatus] = useState('unknown'); // 'in_range' | 'out_of_range' | 'unknown'
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [nearestLibrary, setNearestLibrary] = useState(null);
    const [distanceToLibrary, setDistanceToLibrary] = useState(null);
    const [locationSubscription, setLocationSubscription] = useState(null);
    const [selectedLibraryForLocation, setSelectedLibraryForLocation] = useState(null);

    // Initialize location on mount
    useEffect(() => {
        initializeLocation();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    const initializeLocation = async () => {
        setIsLoading(true);

        try {
            const hasPermission = await requestLocationPermission();
            setPermissionGranted(hasPermission);

            if (hasPermission) {
                // Just get current location on init, don't check library proximity
                // Library check will happen when user selects a library
                const location = await getCurrentLocation();
                if (location) {
                    setUserLocation(location);
                }
            } else {
                setLocationStatus('unknown');
            }
        } catch (error) {
            console.error('Error initializing location:', error);
            setLocationStatus('unknown');
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh location manually - REQUIRES a library to be passed
    const refreshLocation = useCallback(async (targetLibrary) => {
        // Guard: require library to be passed
        if (!targetLibrary || !targetLibrary.latitude || !targetLibrary.longitude) {
            console.warn('refreshLocation called without valid library - ignoring');
            return;
        }
        
        setIsLoading(true);
        try {
            console.log('Refreshing location with library:', targetLibrary.name, 'Radius:', targetLibrary.radius_meters);
            
            const result = await checkLibraryProximity(targetLibrary);

            if (result.error) {
                console.warn('Location error:', result.error);
                setIsLoading(false);
                return;
            }

            console.log('Location result:', {
                inRange: result.inRange,
                distance: result.distance,
                library: result.nearestLibrary?.name
            });

            setUserLocation(result.userLocation);
            setNearestLibrary(result.nearestLibrary);
            setDistanceToLibrary(result.distance);
            setLocationStatus(result.inRange ? 'in_range' : 'out_of_range');
        } catch (error) {
            console.error('Error refreshing location:', error);
        } finally {
            setIsLoading(false);
        }
    }, []); // No dependencies - always uses the passed library

    // Set the library to check location against
    const setTargetLibrary = useCallback((library) => {
        // Guard: require valid library with coordinates
        if (!library || !library.latitude || !library.longitude) {
            console.warn('setTargetLibrary called without valid library - ignoring');
            return;
        }
        
        console.log('Setting target library:', library.name, 'Radius:', library.radius_meters);
        setSelectedLibraryForLocation(library);
        // Auto-refresh location with the new library
        refreshLocation(library);
    }, [refreshLocation]);

    // Start continuous location watching
    const startWatching = useCallback(async (targetLibrary = null) => {
        if (locationSubscription) {
            locationSubscription.remove();
        }

        const libraryToWatch = targetLibrary || selectedLibraryForLocation;

        const subscription = await watchLocation((data) => {
            setUserLocation({ latitude: data.latitude, longitude: data.longitude });
            setNearestLibrary(data.nearestLibrary);
            setDistanceToLibrary(data.distance);
            setLocationStatus(data.inRange ? 'in_range' : 'out_of_range');
        }, libraryToWatch);

        if (subscription) {
            setLocationSubscription(subscription);
        }
    }, [locationSubscription, selectedLibraryForLocation]);

    // Stop watching location
    const stopWatching = useCallback(() => {
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
        }
    }, [locationSubscription]);

    return (
        <LocationContext.Provider value={{
            // State
            locationStatus,
            permissionGranted,
            isLoading,
            userLocation,
            nearestLibrary,
            distanceToLibrary,
            selectedLibraryForLocation,

            // Actions
            refreshLocation,
            startWatching,
            stopWatching,
            setTargetLibrary,
            getLibraryLocations,
        }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);
