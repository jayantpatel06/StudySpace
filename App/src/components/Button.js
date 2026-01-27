import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { lightImpact } from '../utils/haptics';

/**
 * Primary button with consistent styling
 */
export const PrimaryButton = ({
    children,
    onPress,
    disabled = false,
    loading = false,
    style,
    textStyle,
    haptic = true,
    ...props
}) => {
    const { colors } = useTheme();

    const handlePress = () => {
        if (haptic) lightImpact();
        onPress?.();
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: disabled ? colors.textMuted : colors.primary },
                style
            ]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <Text style={[styles.buttonText, textStyle]}>{children}</Text>
            )}
        </TouchableOpacity>
    );
};

/**
 * Secondary/outline button
 */
export const SecondaryButton = ({
    children,
    onPress,
    disabled = false,
    loading = false,
    style,
    textStyle,
    haptic = true,
    ...props
}) => {
    const { colors } = useTheme();

    const handlePress = () => {
        if (haptic) lightImpact();
        onPress?.();
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles.secondaryButton,
                {
                    borderColor: disabled ? colors.textMuted : colors.primary,
                    backgroundColor: 'transparent',
                },
                style
            ]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={colors.primary} size="small" />
            ) : (
                <Text style={[
                    styles.buttonText,
                    { color: disabled ? colors.textMuted : colors.primary },
                    textStyle
                ]}>
                    {children}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    secondaryButton: {
        borderWidth: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
