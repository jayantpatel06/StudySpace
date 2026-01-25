import { supabase, isSupabaseConfigured } from '../config/supabase';

/**
 * Real-time subscription manager for seat updates
 */
class RealtimeService {
    constructor() {
        this.subscriptions = new Map();
    }

    /**
     * Subscribe to seat status changes
     * @param {function} onSeatChange - Callback when a seat changes
     * @returns {function} Unsubscribe function
     */
    subscribeToSeats(onSeatChange) {
        if (!isSupabaseConfigured()) {
            console.log('Supabase not configured, real-time disabled');
            return () => { };
        }

        const channel = supabase
            .channel('seats-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'seats',
                },
                (payload) => {
                    console.log('Seat change received:', payload);
                    onSeatChange({
                        type: payload.eventType,
                        seat: payload.new || payload.old,
                        oldSeat: payload.old,
                    });
                }
            )
            .subscribe((status) => {
                console.log('Seats subscription status:', status);
            });

        this.subscriptions.set('seats', channel);

        return () => {
            channel.unsubscribe();
            this.subscriptions.delete('seats');
        };
    }

    /**
     * Subscribe to booking changes for a specific user
     * @param {number} userId - User ID to watch
     * @param {function} onBookingChange - Callback when booking changes
     * @returns {function} Unsubscribe function
     */
    subscribeToBookings(userId, onBookingChange) {
        if (!isSupabaseConfigured()) {
            console.log('Supabase not configured, real-time disabled');
            return () => { };
        }

        const channel = supabase
            .channel(`bookings-user-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('Booking change received:', payload);
                    onBookingChange({
                        type: payload.eventType,
                        booking: payload.new || payload.old,
                        oldBooking: payload.old,
                    });
                }
            )
            .subscribe((status) => {
                console.log('Bookings subscription status:', status);
            });

        this.subscriptions.set(`bookings-${userId}`, channel);

        return () => {
            channel.unsubscribe();
            this.subscriptions.delete(`bookings-${userId}`);
        };
    }

    /**
     * Subscribe to leaderboard changes
     * @param {function} onLeaderboardChange - Callback when rankings change
     * @returns {function} Unsubscribe function
     */
    subscribeToLeaderboard(onLeaderboardChange) {
        if (!isSupabaseConfigured()) {
            return () => { };
        }

        const channel = supabase
            .channel('leaderboard-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                },
                (payload) => {
                    // Only trigger if points changed
                    if (payload.new?.points !== payload.old?.points) {
                        onLeaderboardChange({
                            user: payload.new,
                            oldPoints: payload.old?.points,
                            newPoints: payload.new?.points,
                        });
                    }
                }
            )
            .subscribe();

        this.subscriptions.set('leaderboard', channel);

        return () => {
            channel.unsubscribe();
            this.subscriptions.delete('leaderboard');
        };
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll() {
        this.subscriptions.forEach((channel, key) => {
            channel.unsubscribe();
            console.log(`Unsubscribed from ${key}`);
        });
        this.subscriptions.clear();
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.subscriptions.size > 0;
    }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// Convenience exports
export const subscribeToSeats = (callback) => realtimeService.subscribeToSeats(callback);
export const subscribeToBookings = (userId, callback) => realtimeService.subscribeToBookings(userId, callback);
export const subscribeToLeaderboard = (callback) => realtimeService.subscribeToLeaderboard(callback);
export const unsubscribeAll = () => realtimeService.unsubscribeAll();
