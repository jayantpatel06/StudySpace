import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

/**
 * Auth Provider using Clerk with Supabase sync
 * Requires ClerkProvider wrapper in App.js
 */
export const AuthProvider = ({ children }) => {
    const clerkAuth = useClerkAuth();
    const clerkUser = useUser();
    const [supabaseUser, setSupabaseUser] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const isSignedIn = clerkAuth?.isSignedIn;
    const isLoading = clerkAuth?.isLoaded === false || isSyncing;
    const user = clerkUser?.user;

    // Sync Clerk user to Supabase when signed in
    const syncUserToSupabase = useCallback(async (clerkUserData) => {
        if (!clerkUserData) return null;

        try {
            setIsSyncing(true);
            const clerkId = clerkUserData.id;
            const email = clerkUserData.primaryEmailAddress?.emailAddress;
            const fullName = clerkUserData.fullName || 
                `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim() ||
                'User';
            const avatarUrl = clerkUserData.imageUrl;

            // Check if user exists in Supabase
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_id', clerkId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 = no rows returned, which is fine for new users
                console.error('Error fetching user from Supabase:', fetchError);
            }

            if (existingUser) {
                // Update existing user
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({
                        name: fullName,
                        email: email,
                        avatar_url: avatarUrl,
                        last_login_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('clerk_id', clerkId)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating user in Supabase:', updateError);
                    return existingUser;
                }
                
                return updatedUser;
            } else {
                // Create new user
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        clerk_id: clerkId,
                        name: fullName,
                        email: email,
                        avatar_url: avatarUrl,
                        points: 0,
                        streak: 0,
                        total_focus_time: 0,
                        last_login_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating user in Supabase:', insertError);
                    return null;
                }
                
                return newUser;
            }
        } catch (error) {
            console.error('Error syncing user to Supabase:', error);
            return null;
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // Effect to sync user when Clerk auth state changes
    useEffect(() => {
        if (isSignedIn && user) {
            syncUserToSupabase(user).then(setSupabaseUser);
        } else {
            setSupabaseUser(null);
        }
    }, [isSignedIn, user?.id, syncUserToSupabase]);

    const signOut = async () => {
        if (clerkAuth?.signOut) {
            setSupabaseUser(null);
            await clerkAuth.signOut();
        }
    };

    const getUserInfo = () => {
        if (!user) return null;
        
        // Combine Clerk data with Supabase data
        return {
            id: supabaseUser?.id || null,  // Supabase user ID for database relations
            clerkId: user.id,               // Clerk ID for auth
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            imageUrl: user.imageUrl,
            // Supabase specific fields
            points: supabaseUser?.points || 0,
            streak: supabaseUser?.streak || 0,
            totalFocusTime: supabaseUser?.total_focus_time || 0,
            department: supabaseUser?.department,
        };
    };

    // Refresh user data from Supabase
    const refreshUserData = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_id', user.id)
                .single();

            if (!error && data) {
                setSupabaseUser(data);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    }, [user?.id]);

    return (
        <AuthContext.Provider value={{
            isSignedIn,
            isLoading,
            user,
            supabaseUser,
            userInfo: getUserInfo(),
            signOut,
            refreshUserData,
            syncUserToSupabase,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
