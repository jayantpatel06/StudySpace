import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase project configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://dzqnwffhhwkqguethgdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cW53ZmZoaHdrcWd1ZXRoZ2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTQxMTgsImV4cCI6MjA4NDgzMDExOH0.SofHJ2axbcRqg8b_zM8s9I99V5BXlBfSfvwCwjVDorc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};
