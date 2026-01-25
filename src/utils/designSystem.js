/**
 * Typography constants for consistent text styling
 * Use these with StyleSheet.create() for reusable text styles
 */

export const typography = {
    // Headings
    h1: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
    },
    h2: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
    },
    h3: {
        fontFamily: 'Inter_500Medium',
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
    },

    // Body text
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 24,
    },
    bodyMedium: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        lineHeight: 24,
    },
    bodySmall: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        lineHeight: 20,
    },

    // Captions and labels
    caption: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        lineHeight: 16,
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    labelSmall: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Button text
    button: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 20,
    },
    buttonSmall: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
    },
};

// Spacing constants
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border radius constants
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export default { typography, spacing, borderRadius };
