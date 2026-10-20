/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07080c',
          900: '#0b0c10',
          800: '#11131a',
          700: '#171923',
          600: '#222533',
        },
        primary: {
          main: '#f59e0b',
          glow: '#d97706',
        },
        accent: {
          red: '#ef4444',
          blue: '#3b82f6',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}

