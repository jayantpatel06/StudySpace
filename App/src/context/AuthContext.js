import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../config/supabase";

const AuthContext = createContext();

/**
 * Auth Provider using Supabase Auth
 */
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSignedIn = !!session;

  // Fetch user profile from users table
  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user profile:", fetchError);
      }

      if (existingUser) {
        // Update last login
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("auth_id", authUser.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating user:", updateError);
          return existingUser;
        }
        return updatedUser;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  // Create user profile in users table after signup
  const createUserProfile = useCallback(async (authUser, userData = {}) => {
    if (!authUser) return null;

    try {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          auth_id: authUser.id,
          email: authUser.email,
          name:
            userData.fullName || userData.firstName
              ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
              : "User",
          avatar_url: null,
          points: 0,
          streak: 0,
          total_focus_time: 0,
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        return null;
      }

      return newUser;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user).then(setUserProfile);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // Sign in with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // Sign up with email and password
  const signUp = async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
        },
      },
    });

    if (error) throw error;

    // Create user profile in users table
    if (data.user) {
      const profile = await createUserProfile(data.user, userData);
      setUserProfile(profile);
    }

    return data;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserProfile(null);
  };

  // Get user info (combining auth user and profile)
  const getUserInfo = () => {
    if (!user) return null;

    return {
      id: userProfile?.id ?? null,
      authId: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name ?? null,
      lastName: user.user_metadata?.last_name ?? null,
      fullName:
        (userProfile?.name ?? user.user_metadata?.first_name)
          ? `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim()
          : null,
      imageUrl: userProfile?.avatar_url ?? null,
      points: userProfile?.points ?? 0,
      streak: userProfile?.streak ?? 0,
      totalFocusTime: userProfile?.total_focus_time ?? 0,
      department: userProfile?.department ?? null,
    };
  };

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        isLoading,
        user,
        session,
        userProfile,
        userInfo: getUserInfo(),
        signIn,
        signUp,
        signOut,
        refreshUserData,
        createUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
