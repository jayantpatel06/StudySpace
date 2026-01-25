import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightImpact } from '../utils/haptics';

/**
 * Icon button with consistent styling
 */
export const IconButton = ({
    icon,
    onPress,
    size = 24,
    color,
    variant = 'default', // 'default' | 'filled' | 'outlined'
    disabled = false,
    style,
    haptic = true,
}) => {
    const { colors } = useTheme();

    const handlePress = () => {
        if (haptic) lightImpact();
        onPress?.();
    };

    const getContainerStyle = () => {
        const baseSize = size + 16;
        switch (variant) {
            case 'filled':
                return {
                    backgroundColor: colors.primary,
                    width: baseSize,
                    height: baseSize,
                };
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border,
                    width: baseSize,
                    height: baseSize,
                };
            default:
                return {
                    backgroundColor: 'transparent',
                    width: baseSize,
                    height: baseSize,
                };
        }
    };

    const getIconColor = () => {
        if (color) return color;
        if (disabled) return colors.textMuted;
        if (variant === 'filled') return '#fff';
        return colors.text;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getContainerStyle(),
                { opacity: disabled ? 0.5 : 1 },
                style
            ]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <MaterialIcons name={icon} size={size} color={getIconColor()} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default IconButton;
