import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable Card component with consistent styling
 */
export const Card = ({
    children,
    style,
    variant = 'default', // 'default' | 'elevated' | 'outlined'
    padding = 16,
    ...props
}) => {
    const { colors } = useTheme();

    const getCardStyle = () => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                };
            case 'outlined':
                return {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            default:
                return {
                    backgroundColor: colors.surface,
                };
        }
    };

    return (
        <View
            style={[
                styles.card,
                getCardStyle(),
                { padding },
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
    },
});

export default Card;
