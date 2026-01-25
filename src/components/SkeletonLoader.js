import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

/**
 * SkeletonLoader - Shimmering placeholder component
 * @param {object} props
 * @param {'card' | 'text' | 'circle' | 'rect'} props.variant - Shape variant
 * @param {number} props.width - Width (optional, defaults based on variant)
 * @param {number} props.height - Height (optional, defaults based on variant)
 * @param {object} props.style - Additional styles
 */
const SkeletonLoader = ({ variant = 'rect', width, height, style }) => {
    const { colors, isDark } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1, // Infinite repeat
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const getVariantStyles = () => {
        switch (variant) {
            case 'card':
                return {
                    width: width || '100%',
                    height: height || 120,
                    borderRadius: 12,
                };
            case 'text':
                return {
                    width: width || '80%',
                    height: height || 16,
                    borderRadius: 4,
                };
            case 'circle':
                const size = width || height || 48;
                return {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                };
            case 'rect':
            default:
                return {
                    width: width || 100,
                    height: height || 100,
                    borderRadius: 8,
                };
        }
    };

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { backgroundColor: isDark ? '#3c4043' : '#e2e8f0' },
                getVariantStyles(),
                animatedStyle,
                style,
            ]}
        />
    );
};

/**
 * SkeletonCard - Pre-built card skeleton with multiple lines
 */
export const SkeletonCard = ({ style }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[
            styles.cardContainer,
            { backgroundColor: isDark ? colors.surface : colors.surface },
            style
        ]}>
            <View style={styles.cardHeader}>
                <SkeletonLoader variant="circle" width={40} />
                <View style={styles.cardHeaderText}>
                    <SkeletonLoader variant="text" width={120} height={14} />
                    <SkeletonLoader variant="text" width={80} height={12} style={{ marginTop: 8 }} />
                </View>
            </View>
            <SkeletonLoader variant="text" width="100%" height={14} style={{ marginTop: 16 }} />
            <SkeletonLoader variant="text" width="70%" height={14} style={{ marginTop: 8 }} />
        </View>
    );
};

/**
 * SkeletonMapGrid - Skeleton for the seat map
 */
export const SkeletonMapGrid = ({ rows = 4, cols = 6, style }) => {
    const seats = Array(rows * cols).fill(null);

    return (
        <View style={[styles.mapGrid, style]}>
            {seats.map((_, index) => (
                <SkeletonLoader
                    key={index}
                    variant="rect"
                    width={36}
                    height={36}
                    style={styles.mapSeat}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
    cardContainer: {
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    mapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    mapSeat: {
        margin: 4,
    },
});

export default SkeletonLoader;
