import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightImpact } from '../utils/haptics';

/**
 * Consistent screen header for detail screens
 */
export const ScreenHeader = ({
    title,
    onBack,
    rightAction,
    rightIcon,
    onRightPress,
    transparent = false,
    style,
}) => {
    const { colors } = useTheme();

    const handleBack = () => {
        lightImpact();
        onBack?.();
    };

    const handleRightPress = () => {
        lightImpact();
        onRightPress?.();
    };

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: transparent ? 'transparent' : colors.headerBg,
                borderBottomColor: transparent ? 'transparent' : colors.border,
            },
            style
        ]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
            </Text>

            <View style={styles.rightSection}>
                {rightAction || (rightIcon && onRightPress && (
                    <TouchableOpacity
                        style={styles.rightButton}
                        onPress={handleRightPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name={rightIcon} size={24} color={colors.text} />
                    </TouchableOpacity>
                ))}
                {!rightAction && !rightIcon && <View style={styles.placeholder} />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 48,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    rightSection: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    rightButton: {
        padding: 8,
        marginRight: -8,
    },
    placeholder: {
        width: 40,
    },
});

export default ScreenHeader;
