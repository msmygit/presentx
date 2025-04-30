/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // This enables class-based dark mode
  theme: {
    extend: {
      colors: {
        // Add any custom colors here if needed
        primary: {
          light: '#6366F1', // indigo-500
          DEFAULT: '#4F46E5', // indigo-600
          dark: '#4338CA',  // indigo-700
        },
        secondary: {
          light: '#EC4899', // pink-500
          DEFAULT: '#DB2777', // pink-600
          dark: '#BE185D',  // pink-700
        },
        neutral: {
          // Define shades for text, backgrounds, borders etc.
          50: '#F9FAFB',
          100: '#F3F4F6', // Used in MainLayout light bg
          200: '#E5E7EB', // Used in MainLayout light footer bg
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151', // Used in MainLayout dark footer bg
          800: '#1F2937', // Used in MainLayout dark header bg
          900: '#111827', // Used in MainLayout dark bg
          950: '#030712',
        },
        success: {
          light: '#10B981', // emerald-500
          DEFAULT: '#059669', // emerald-600
          dark: '#047857',  // emerald-700
        },
        warning: {
          light: '#F59E0B', // amber-500
          DEFAULT: '#D97706', // amber-600
          dark: '#B45309',  // amber-700
        },
        error: {
          light: '#EF4444', // red-500
          DEFAULT: '#DC2626', // red-600
          dark: '#B91C1C',  // red-700
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
} 