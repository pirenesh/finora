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
          bg: '#0F172A',      // Premium Dark Navy/Black
          card: '#1E293B',    // Card Background
          border: '#334155',  // Border Color
          text: '#F8FAFC',    // Text Primary
        },
        brand: {
          primary: '#10B981', // Emerald Green
          secondary: '#2563EB', // Royal Blue
          success: '#34D399', // Light Emerald
          danger: '#F87171',  // Danger Red
          warning: '#FBBF24', // Warning Yellow
          info: '#3B82F6',    // Info Blue
          muted: '#94A3B8',   // Text Muted
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
