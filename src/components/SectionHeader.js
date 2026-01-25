import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightImpact } from '../utils/haptics';

/**
 * Section header with optional action button
 */
export const SectionHeader = ({
    title,
    actionText,
    onActionPress,
    icon,
    style,
}) => {
    const { colors } = useTheme();

    const handleActionPress = () => {
        lightImpact();
        onActionPress?.();
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftSection}>
                {icon && (
                    <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
                )}
                <Text style={[styles.title, { color: colors.textSecondary }]}>
                    {title}
                </Text>
            </View>
            {actionText && onActionPress && (
                <TouchableOpacity onPress={handleActionPress}>
                    <Text style={[styles.actionText, { color: colors.primary }]}>
                        {actionText}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SectionHeader;
