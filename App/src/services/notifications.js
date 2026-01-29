import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for push token
const PUSH_TOKEN_KEY = '@studysync_push_token';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Push Notifications Service
 */
class PushNotifications {
    constructor() {
        this.notificationListener = null;
        this.responseListener = null;
    }

    /**
     * Register for push notifications
     */
    async register() {
        try {
            if (!Device.isDevice) {
                console.log('Push notifications require a physical device');
                return null;
            }

            // Check existing permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            // Request permission if not granted
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Push notification permission denied');
                return null;
            }

            // Get push token
            try {
                const token = await Notifications.getExpoPushTokenAsync();

                await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
                console.log('Push token:', token.data);

                return token.data;
            } catch (tokenError) {
                console.warn('Error getting push token (this is normal in development):', tokenError.message);
                return null;
            }
        } catch (error) {
            console.warn('Error registering for push notifications:', error.message);
            return null;
        }
    }

    /**
     * Get stored push token
     */
    async getToken() {
        return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    }

    /**
     * Start listening for notifications
     */
    startListening(onNotification, onInteraction) {
        // Listen for incoming notifications
        this.notificationListener = Notifications.addNotificationReceivedListener(
            notification => {
                console.log('Notification received:', notification);
                if (onNotification) onNotification(notification);
            }
        );

        // Listen for notification interactions
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            response => {
                console.log('Notification interaction:', response);
                if (onInteraction) onInteraction(response);
            }
        );
    }

    /**
     * Stop listening for notifications
     */
    stopListening() {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
            this.notificationListener = null;
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
            this.responseListener = null;
        }
    }

    /**
     * Schedule a local notification
     */
    async scheduleLocal(title, body, data = {}, trigger = null) {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: trigger || null, // null = immediate
        });
        return id;
    }

    /**
     * Schedule booking reminder (15 minutes before)
     */
    async scheduleBookingReminder(booking) {
        const triggerTime = new Date(booking.start_time);
        triggerTime.setMinutes(triggerTime.getMinutes() - 15);

        // Only schedule if in the future
        if (triggerTime > new Date()) {
            return await this.scheduleLocal(
                '📚 Booking Reminder',
                `Your seat ${booking.seat_id} is reserved in 15 minutes!`,
                { type: 'booking_reminder', bookingId: booking.id },
                { date: triggerTime }
            );
        }
        return null;
    }

    /**
     * Schedule "Still there?" check-in reminder
     */
    async scheduleCheckInReminder(booking) {
        const triggerTime = new Date(booking.start_time);
        triggerTime.setMinutes(triggerTime.getMinutes() + 10);

        if (triggerTime > new Date()) {
            return await this.scheduleLocal(
                '📍 Still there?',
                'Tap to confirm you\'re using your seat, or it may be released.',
                { type: 'checkin_reminder', bookingId: booking.id },
                { date: triggerTime }
            );
        }
        return null;
    }

    /**
     * Send focus session complete notification
     */
    async notifyFocusComplete(sessionMinutes, pointsEarned) {
        return await this.scheduleLocal(
            '🎉 Focus Session Complete!',
            `Great job! You focused for ${sessionMinutes} minutes and earned ${pointsEarned} points.`,
            { type: 'focus_complete' }
        );
    }

    /**
     * Send booking confirmation notification
     */
    async notifyBookingConfirmed(seatId, startTime) {
        const time = new Date(startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        return await this.scheduleLocal(
            '✅ Booking Confirmed',
            `Seat ${seatId} is reserved for you at ${time}`,
            { type: 'booking_confirmed' }
        );
    }

    /**
     * Cancel a scheduled notification
     */
    async cancel(notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * Get all pending notifications
     */
    async getPending() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }

    /**
     * Set badge count
     */
    async setBadge(count) {
        await Notifications.setBadgeCountAsync(count);
    }
}

export const pushNotifications = new PushNotifications();
