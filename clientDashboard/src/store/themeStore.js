import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: "light", // 'light' or 'dark'

            toggleTheme: () => {
                const newTheme = get().theme === "light" ? "dark" : "light";
                set({ theme: newTheme });

                // Apply theme to document
                if (newTheme === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            },

            setTheme: (theme) => {
                set({ theme });
                if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            },

            // Initialize theme on app load
            initTheme: () => {
                const { theme } = get();
                if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            },
        }),
        {
            name: "theme-storage",
        }
    )
);
