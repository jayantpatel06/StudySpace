import * as SecureStore from 'expo-secure-store';

// Clerk configuration
// Get your publishable key from: https://dashboard.clerk.com/
export const CLERK_PUBLISHABLE_KEY = 'pk_test_b2JsaWdpbmctc2hlcGhlcmQtNTAuY2xlcmsuYWNjb3VudHMuZGV2JA';

// Token cache for Clerk using SecureStore
export const tokenCache = {
    async getToken(key) {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (err) {
            console.error('Error getting token:', err);
            return null;
        }
    },
    async saveToken(key, value) {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (err) {
            console.error('Error saving token:', err);
        }
    },
    async clearToken(key) {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (err) {
            console.error('Error clearing token:', err);
        }
    },
};
