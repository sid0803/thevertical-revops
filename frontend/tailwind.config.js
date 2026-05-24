/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0A0F1E',    // deep navy - sidebar bg
          mid: '#111827',     // dark gray - secondary surface
        },
        accent: {
          blue: '#2563EB',    // electric blue - buttons, highlights
          cyan: '#06B6D4',    // cyan - hover states, tags
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        brandBg: '#F8FAFC',   // page background
        cardWhite: '#FFFFFF',
        borderSlate: '#E2E8F0',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
