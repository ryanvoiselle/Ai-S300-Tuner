/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#1A1A1A',
        raceRed: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        simPurple: {
          600: '#7C3AED',
          700: '#6D28D9',
        },
        ecuGreen: {
          400: '#4ADE80',
          600: '#16A34A',
          700: '#15803D',
        },
        exportBlue: {
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
