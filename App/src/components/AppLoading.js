import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * App loading splash screen shown while fonts and auth are loading
 */
const AppLoading = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <MaterialIcons name="menu-book" size={64} color="#3b82f6" />
                </View>
                <Text style={styles.title}>StudySync</Text>
                <Text style={styles.subtitle}>Smart Library Seating</Text>
                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 48,
    },
    loader: {
        marginTop: 24,
    },
});

export default AppLoading;
