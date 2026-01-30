import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { useLibrary } from './LibraryContext';

const BookingContext = createContext();

// Fallback user ID for development
const FALLBACK_USER_ID = 1;

export const BookingProvider = ({ children }) => {
    const { userInfo } = useAuth();
    const { selectedLibrary } = useLibrary();

    // Use authenticated user ID or fallback
    const userId = useMemo(() => userInfo?.id || FALLBACK_USER_ID, [userInfo?.id]);

    const [bookings, setBookings] = useState([]);
    const [activeBooking, setActiveBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch active booking when user changes
    useEffect(() => {
        fetchActiveBooking();
    }, [userId]);

    const fetchActiveBooking = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: apiError } = await api.getActiveBooking(userId);
            if (apiError && apiError !== 'JSON object requested, multiple (or no) rows returned') {
                setError(apiError.message);
            } else if (data) {
                // Transform to match existing format
                setActiveBooking({
                    id: data.id,
                    seatId: data.seat_id,
                    location: data.location || 'Library',
                    startTime: new Date(data.start_time).getTime(),
                    duration: data.duration,
                    status: data.status,
                    checkedIn: data.checked_in,
                    expiresAt: new Date(data.start_time).getTime() + (data.duration * 60 * 1000),
                });
            }
        } catch (err) {
            console.error('Error fetching active booking:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const fetchBookingHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error: apiError } = await api.getBookingHistory(userId);
            if (!apiError && data) {
                setBookings(data.map(b => ({
                    id: b.id,
                    seatId: b.seat_id,
                    location: b.location || 'Library',
                    startTime: new Date(b.start_time).getTime(),
                    duration: b.duration,
                    status: b.status,
                    checkedIn: b.checked_in,
                })));
            }
        } catch (err) {
            console.error('Error fetching booking history:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const createBooking = async (seatId, duration, location) => {
        setIsLoading(true);
        setError(null);

        try {
            const libraryId = selectedLibrary?.id || null;
            const { data, error: apiError } = await api.createBooking(userId, seatId, duration, location, libraryId);

            if (apiError) {
                setError(apiError.message);
                return null;
            }

            const newBooking = {
                id: data.id || `bk_${Date.now()}`,
                seatId: data.seat_id || seatId,
                location: data.location || location,
                startTime: Date.now(),
                duration,
                status: 'pending_checkin',
                checkedIn: false,
                expiresAt: Date.now() + duration * 60 * 1000,
            };

            setActiveBooking(newBooking);
            setBookings(prev => [newBooking, ...prev]);
            return newBooking;
        } catch (err) {
            console.error('Error creating booking:', err);
            setError('Failed to create booking');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const checkIn = async (bookingId) => {
        if (!activeBooking || activeBooking.id !== bookingId) return;

        try {
            await api.checkInBooking(bookingId, activeBooking.seatId);
            setActiveBooking(prev => ({ ...prev, status: 'active', checkedIn: true }));
        } catch (err) {
            console.error('Error checking in:', err);
        }
    };

    const cancelBooking = async (bookingId) => {
        if (!activeBooking || activeBooking.id !== bookingId) return;

        try {
            await api.cancelBooking(bookingId, activeBooking.seatId);
            setActiveBooking(null);
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
            ));
        } catch (err) {
            console.error('Error cancelling booking:', err);
        }
    };

    const completeBooking = async (bookingId) => {
        if (!activeBooking || activeBooking.id !== bookingId) return;

        try {
            await api.completeBooking(bookingId, activeBooking.seatId);
            setActiveBooking(null);
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'completed' } : b
            ));
        } catch (err) {
            console.error('Error completing booking:', err);
        }
    };

    return (
        <BookingContext.Provider value={{
            bookings,
            activeBooking,
            isLoading,
            error,
            createBooking,
            checkIn,
            cancelBooking,
            completeBooking,
            fetchActiveBooking,
            fetchBookingHistory,
        }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => useContext(BookingContext);

