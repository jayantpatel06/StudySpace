import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';

const AuthContext = createContext();

/**
 * Auth Provider using Clerk
 * Requires ClerkProvider wrapper in App.js
 */
export const AuthProvider = ({ children }) => {
    const clerkAuth = useClerkAuth();
    const clerkUser = useUser();

    const isSignedIn = clerkAuth?.isSignedIn;
    const isLoading = clerkAuth?.isLoaded === false;
    const user = clerkUser?.user;

    const signOut = async () => {
        if (clerkAuth?.signOut) {
            await clerkAuth.signOut();
        }
    };

    const getUserInfo = () => {
        if (!user) return null;
        return {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            imageUrl: user.imageUrl,
        };
    };

    return (
        <AuthContext.Provider value={{
            isSignedIn,
            isLoading,
            user,
            userInfo: getUserInfo(),
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
