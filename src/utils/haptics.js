import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback for button presses
 */
export const lightImpact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium haptic feedback for important actions
 */
export const mediumImpact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Heavy haptic feedback for significant events
 */
export const heavyImpact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Success notification haptic (for completed actions)
 */
export const successNotification = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning notification haptic
 */
export const warningNotification = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error notification haptic
 */
export const errorNotification = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Selection changed haptic (for toggles, selections)
 */
export const selectionChanged = () => {
    Haptics.selectionAsync();
};
