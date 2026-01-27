import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { selectionChanged } from '../utils/haptics';

/**
 * Chip component for tags, filters, and selections
 */
export const Chip = ({
    label,
    selected = false,
    onPress,
    disabled = false,
    icon,
    style,
    size = 'medium', // 'small' | 'medium' | 'large'
}) => {
    const { colors } = useTheme();

    const handlePress = () => {
        selectionChanged();
        onPress?.();
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12 };
            case 'large':
                return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 };
            default:
                return { paddingVertical: 8, paddingHorizontal: 14, fontSize: 14 };
        }
    };

    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                    borderColor: selected ? colors.primary : colors.border,
                    paddingVertical: sizeStyles.paddingVertical,
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                    opacity: disabled ? 0.5 : 1,
                },
                style
            ]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {icon}
            <Text style={[
                styles.label,
                {
                    color: selected ? '#fff' : colors.text,
                    fontSize: sizeStyles.fontSize,
                }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    label: {
        fontWeight: '500',
    },
});

export default Chip;
