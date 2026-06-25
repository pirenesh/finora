/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0800',      // Primary Background
          card: '#1a1400',    // Secondary/Card Background
          border: '#3d2e00',  // Border Color
          text: '#fffbf0',    // Text Primary
        },
        brand: {
          primary: '#d4af37', // Gold Primary
          success: '#86efac', // Success Green
          danger: '#fca5a5',  // Danger Red
          warning: '#fbbf24', // Gold Light
          info: '#93c5fd',    // Info Blue
          muted: '#8a7a40',   // Text Muted
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
