import { useEffect, useState, useCallback } from 'react';
import { syncQueue } from '../services/syncQueue';
import { pushNotifications } from '../services/notifications';
import { offlineStorage } from '../services/offline';

/**
 * Hook to manage offline sync and network status
 */
export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        // Start sync queue listener
        syncQueue.startListening();

        // Add sync event listener
        const removeListener = syncQueue.addListener((event, data) => {
            switch (event) {
                case 'syncStart':
                    setIsSyncing(true);
                    break;
                case 'syncComplete':
                    setIsSyncing(false);
                    updateStatus();
                    break;
                case 'syncError':
                    setIsSyncing(false);
                    break;
                case 'queued':
                    updateStatus();
                    break;
            }
        });

        // Initial status
        updateStatus();

        return () => {
            syncQueue.stopListening();
            removeListener();
        };
    }, []);

    const updateStatus = useCallback(async () => {
        const status = await syncQueue.getStatus();
        setIsOnline(status.isOnline);
        setPendingCount(status.pendingCount);
        setLastSync(status.lastSync);
    }, []);

    const forceSync = useCallback(async () => {
        await syncQueue.processQueue();
    }, []);

    return {
        isOnline,
        pendingCount,
        isSyncing,
        lastSync,
        forceSync,
    };
}

/**
 * Hook to manage push notifications
 */
export function useNotifications(onInteraction) {
    const [hasPermission, setHasPermission] = useState(false);
    const [pushToken, setPushToken] = useState(null);

    useEffect(() => {
        // Register for push notifications
        pushNotifications.register().then(token => {
            if (token) {
                setHasPermission(true);
                setPushToken(token);
            }
        });

        // Start listening for notifications
        pushNotifications.startListening(
            null, // onNotification - handled by system
            onInteraction
        );

        return () => {
            pushNotifications.stopListening();
        };
    }, [onInteraction]);

    const scheduleBookingReminder = useCallback(async (booking) => {
        return await pushNotifications.scheduleBookingReminder(booking);
    }, []);

    const notifyFocusComplete = useCallback(async (minutes, points) => {
        return await pushNotifications.notifyFocusComplete(minutes, points);
    }, []);

    const notifyBookingConfirmed = useCallback(async (seatId, startTime) => {
        return await pushNotifications.notifyBookingConfirmed(seatId, startTime);
    }, []);

    return {
        hasPermission,
        pushToken,
        scheduleBookingReminder,
        notifyFocusComplete,
        notifyBookingConfirmed,
    };
}

/**
 * Hook for offline-first data fetching
 */
export function useCachedData(fetchFn, cacheKey, dependencies = []) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStale, setIsStale] = useState(false);

    useEffect(() => {
        loadData();
    }, dependencies);

    const loadData = useCallback(async () => {
        setIsLoading(true);

        // Try cache first
        const cached = await offlineStorage.get(cacheKey);
        if (cached) {
            setData(cached);
            setIsStale(true);
            setIsLoading(false);
        }

        // Fetch fresh data
        try {
            const fresh = await fetchFn();
            if (fresh) {
                setData(fresh);
                setIsStale(false);
                await offlineStorage.set(cacheKey, fresh);
            }
        } catch (error) {
            console.warn('Failed to fetch fresh data:', error);
            // Keep using cached data
        } finally {
            setIsLoading(false);
        }
    }, [fetchFn, cacheKey]);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const fresh = await fetchFn();
            if (fresh) {
                setData(fresh);
                setIsStale(false);
                await offlineStorage.set(cacheKey, fresh);
            }
        } finally {
            setIsLoading(false);
        }
    }, [fetchFn, cacheKey]);

    return { data, isLoading, isStale, refresh };
}
