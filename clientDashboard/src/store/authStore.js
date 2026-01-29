import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../config/supabase";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      client: null,
      library: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });

        try {
          // Fetch client by username
          const { data: client, error: clientError } = await supabase
            .from("library_clients")
            .select(
              `
              *,
              library:libraries(*)
            `,
            )
            .eq("username", username.trim())
            .eq("is_active", true)
            .single();

          if (clientError || !client) {
            throw new Error("Invalid username or password");
          }

          // Verify password (Base64 for now - should be bcrypt in production)
          const storedPassword = atob(client.password_hash);
          if (storedPassword !== password) {
            throw new Error("Invalid username or password");
          }

          // Update last login
          await supabase
            .from("library_clients")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", client.id);

          set({
            client: {
              id: client.id,
              username: client.username,
              name: client.name,
              email: client.email,
              phone: client.phone,
            },
            library: client.library,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || "Failed to login",
          });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({
          client: null,
          library: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateLibrary: (updates) => {
        const { library } = get();
        if (library) {
          set({ library: { ...library, ...updates } });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "client-auth-storage",
      partialize: (state) => ({
        client: state.client,
        library: state.library,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
