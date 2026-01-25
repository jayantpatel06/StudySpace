import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from './offline';
import * as api from './api';

/**
 * Sync Queue Service
 * Handles offline actions and syncs when back online
 */
class SyncQueue {
    constructor() {
        this.isSyncing = false;
        this.listeners = [];
        this.unsubscribeNetInfo = null;
    }

    /**
     * Start listening for network changes
     */
    startListening() {
        this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable) {
                this.processQueue();
            }
        });
    }

    /**
     * Stop listening for network changes
     */
    stopListening() {
        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
            this.unsubscribeNetInfo = null;
        }
    }

    /**
     * Add a listener for sync events
     */
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event, data) {
        this.listeners.forEach(l => l(event, data));
    }

    /**
     * Check if online
     */
    async isOnline() {
        const state = await NetInfo.fetch();
        return state.isConnected && state.isInternetReachable;
    }

    /**
     * Queue an action for later if offline
     */
    async queueAction(type, payload) {
        const isOnline = await this.isOnline();

        if (isOnline) {
            // Try to execute immediately
            const result = await this.executeAction(type, payload);
            return result;
        }

        // Queue for later
        await offlineStorage.addPendingAction({ type, payload });
        this.notifyListeners('queued', { type, payload });

        return {
            success: true,
            queued: true,
            message: 'Action queued for sync'
        };
    }

    /**
     * Execute an action
     */
    async executeAction(type, payload) {
        try {
            switch (type) {
                case 'CREATE_BOOKING':
                    return await api.createBooking(
                        payload.userId,
                        payload.seatId,
                        payload.duration,
                        payload.location
                    );

                case 'CANCEL_BOOKING':
                    return await api.cancelBooking(payload.bookingId, payload.seatId);

                case 'CHECK_IN':
                    return await api.checkInBooking(payload.bookingId, payload.seatId);

                case 'COMPLETE_BOOKING':
                    return await api.completeBooking(payload.bookingId, payload.seatId);

                case 'RECORD_FOCUS_SESSION':
                    return await api.recordFocusSession(
                        payload.userId,
                        payload.duration,
                        payload.pointsEarned
                    );

                case 'ADD_POINTS':
                    return await api.addUserPoints(payload.userId, payload.points);

                default:
                    console.warn('Unknown action type:', type);
                    return { success: false, error: 'Unknown action type' };
            }
        } catch (error) {
            console.error('Error executing action:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process all pending actions
     */
    async processQueue() {
        if (this.isSyncing) return;

        const isOnline = await this.isOnline();
        if (!isOnline) return;

        this.isSyncing = true;
        this.notifyListeners('syncStart', {});

        try {
            const pending = await offlineStorage.getPendingActions();

            if (pending.length === 0) {
                this.isSyncing = false;
                return;
            }

            console.log(`Processing ${pending.length} pending actions...`);

            let successCount = 0;
            let failCount = 0;

            for (const action of pending) {
                const result = await this.executeAction(action.type, action.payload);

                if (result.success || result.data) {
                    await offlineStorage.removePendingAction(action.id);
                    successCount++;
                    this.notifyListeners('actionSynced', { action, result });
                } else {
                    failCount++;
                    this.notifyListeners('actionFailed', { action, result });

                    // If action is too old (24 hours), remove it
                    if (Date.now() - action.createdAt > 24 * 60 * 60 * 1000) {
                        await offlineStorage.removePendingAction(action.id);
                    }
                }
            }

            await offlineStorage.setLastSync();
            this.notifyListeners('syncComplete', { successCount, failCount });

        } catch (error) {
            console.error('Error processing queue:', error);
            this.notifyListeners('syncError', { error });
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Get queue status
     */
    async getStatus() {
        const pending = await offlineStorage.getPendingActions();
        const lastSync = await offlineStorage.getLastSync();
        const isOnline = await this.isOnline();

        return {
            pendingCount: pending.length,
            lastSync,
            isOnline,
            isSyncing: this.isSyncing,
        };
    }
}

export const syncQueue = new SyncQueue();
