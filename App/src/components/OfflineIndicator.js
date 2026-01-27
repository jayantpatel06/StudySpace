import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useOfflineSync } from '../hooks/useOffline';

/**
 * Offline status banner shown when offline or syncing
 */
const OfflineIndicator = () => {
    const { colors } = useTheme();
    const { isOnline, pendingCount, isSyncing } = useOfflineSync();

    // Don't show if online and no pending actions
    if (isOnline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    const getStatusInfo = () => {
        if (!isOnline) {
            return {
                icon: 'cloud-off',
                text: 'You\'re offline',
                subtext: pendingCount > 0 ? `${pendingCount} actions pending` : 'Changes will sync when online',
                color: '#f59e0b',
            };
        }
        if (isSyncing) {
            return {
                icon: 'sync',
                text: 'Syncing...',
                subtext: `${pendingCount} actions remaining`,
                color: colors.primary,
            };
        }
        if (pendingCount > 0) {
            return {
                icon: 'hourglass-empty',
                text: 'Pending sync',
                subtext: `${pendingCount} actions queued`,
                color: colors.textSecondary,
            };
        }
        return null;
    };

    const status = getStatusInfo();
    if (!status) return null;

    return (
        <View style={[styles.container, { backgroundColor: status.color + '20' }]}>
            <MaterialIcons name={status.icon} size={18} color={status.color} />
            <View style={styles.textContainer}>
                <Text style={[styles.text, { color: status.color }]}>{status.text}</Text>
                <Text style={[styles.subtext, { color: status.color }]}>{status.subtext}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    },
    subtext: {
        fontSize: 12,
        opacity: 0.8,
    },
});

export default OfflineIndicator;
