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
                await refreshLocation();
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

    // Refresh location manually
    const refreshLocation = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await checkLibraryProximity();

            if (result.error) {
                console.warn('Location error:', result.error);
                return;
            }

            setUserLocation(result.userLocation);
            setNearestLibrary(result.nearestLibrary);
            setDistanceToLibrary(result.distance);
            setLocationStatus(result.inRange ? 'in_range' : 'out_of_range');
        } catch (error) {
            console.error('Error refreshing location:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Start continuous location watching
    const startWatching = useCallback(async () => {
        if (locationSubscription) {
            return;
        }

        const subscription = await watchLocation((data) => {
            setUserLocation({ latitude: data.latitude, longitude: data.longitude });
            setNearestLibrary(data.nearestLibrary);
            setDistanceToLibrary(data.distance);
            setLocationStatus(data.inRange ? 'in_range' : 'out_of_range');
        });

        if (subscription) {
            setLocationSubscription(subscription);
        }
    }, [locationSubscription]);

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

            // Actions
            refreshLocation,
            startWatching,
            stopWatching,
            getLibraryLocations,
        }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);
