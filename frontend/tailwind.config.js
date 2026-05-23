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
          DEFAULT: '#1a1a2e',
          light: '#2a2a4e',
          dark: '#0f0f1c',
        },
        accent: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
        },
        sidebar: {
          DEFAULT: '#1e293b',
          light: '#334155',
          dark: '#0f172a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        brandBg: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
