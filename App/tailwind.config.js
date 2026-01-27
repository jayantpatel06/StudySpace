/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#3b82f6", // Vibrant Blue Accent
        "background-light": "#f8fafc",
        "background-dark": "#0f1115", // Deep Charcoal
        "card-dark": "#1a1e26", // Slightly lighter charcoal
        "input-dark": "#242a35", // High contrast input
        "available": "#4ade80",
        "reserved": "#facc15",
        "occupied": "#f87171",
      },
      fontFamily: {
        "heading-bold": ["Montserrat_700Bold", "system-ui", "sans-serif"],
        "body-regular": ["Inter_400Regular", "system-ui", "sans-serif"],
        "body-medium": ["Inter_500Medium", "system-ui", "sans-serif"],
        "display-bold": ["Montserrat_700Bold", "system-ui", "sans-serif"], // Keeping backward compatibility if needed
      },
    },
  },
  plugins: [],
}
