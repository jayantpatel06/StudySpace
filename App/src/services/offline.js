import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
    SEATS_CACHE: '@studysync_seats_cache',
    BOOKINGS_CACHE: '@studysync_bookings_cache',
    USER_PROFILE: '@studysync_user_profile',
    PENDING_ACTIONS: '@studysync_pending_actions',
    LAST_SYNC: '@studysync_last_sync',
};

// Cache expiry time (5 minutes for seats, 1 hour for user data)
const CACHE_TTL = {
    SEATS: 5 * 60 * 1000,
    BOOKINGS: 10 * 60 * 1000,
    USER: 60 * 60 * 1000,
};

/**
 * Offline Storage Service
 * Provides caching and offline-first data access
 */
class OfflineStorage {
    /**
     * Save data with timestamp for cache invalidation
     */
    async set(key, data) {
        try {
            const item = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    /**
     * Get data from cache, returns null if expired
     */
    async get(key, ttl = null) {
        try {
            const item = await AsyncStorage.getItem(key);
            if (!item) return null;

            const parsed = JSON.parse(item);

            // Check if cache is expired
            if (ttl && Date.now() - parsed.timestamp > ttl) {
                return null; // Cache expired
            }

            return parsed.data;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    /**
     * Remove item from cache
     */
    async remove(key) {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }

    /**
     * Clear all app data
     */
    async clearAll() {
        try {
            const keys = Object.values(KEYS);
            await AsyncStorage.multiRemove(keys);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    // === Seats Cache ===
    async cacheSeats(floor, seats) {
        return this.set(`${KEYS.SEATS_CACHE}_floor_${floor}`, seats);
    }

    async getCachedSeats(floor) {
        return this.get(`${KEYS.SEATS_CACHE}_floor_${floor}`, CACHE_TTL.SEATS);
    }

    // === Bookings Cache ===
    async cacheBookings(userId, bookings) {
        return this.set(`${KEYS.BOOKINGS_CACHE}_${userId}`, bookings);
    }

    async getCachedBookings(userId) {
        return this.get(`${KEYS.BOOKINGS_CACHE}_${userId}`, CACHE_TTL.BOOKINGS);
    }

    // === User Profile ===
    async cacheUserProfile(profile) {
        return this.set(KEYS.USER_PROFILE, profile);
    }

    async getCachedUserProfile() {
        return this.get(KEYS.USER_PROFILE, CACHE_TTL.USER);
    }

    // === Pending Actions Queue ===
    async addPendingAction(action) {
        try {
            const pending = await this.get(KEYS.PENDING_ACTIONS) || [];
            pending.push({
                ...action,
                id: Date.now().toString(),
                createdAt: Date.now(),
            });
            await this.set(KEYS.PENDING_ACTIONS, pending);
            return true;
        } catch (error) {
            console.error('Error adding pending action:', error);
            return false;
        }
    }

    async getPendingActions() {
        return await this.get(KEYS.PENDING_ACTIONS) || [];
    }

    async removePendingAction(actionId) {
        try {
            const pending = await this.getPendingActions();
            const filtered = pending.filter(a => a.id !== actionId);
            await this.set(KEYS.PENDING_ACTIONS, filtered);
            return true;
        } catch (error) {
            console.error('Error removing pending action:', error);
            return false;
        }
    }

    async clearPendingActions() {
        return this.remove(KEYS.PENDING_ACTIONS);
    }

    // === Last Sync Timestamp ===
    async setLastSync() {
        return this.set(KEYS.LAST_SYNC, Date.now());
    }

    async getLastSync() {
        const data = await this.get(KEYS.LAST_SYNC);
        return data || 0;
    }
}

export const offlineStorage = new OfflineStorage();
export { KEYS, CACHE_TTL };
