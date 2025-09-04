/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'neuro-light': '#e0e0e0',
        'neuro-dark': '#2c2c2c',
        'gold': {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      boxShadow: {
        'neuro-light': '8px 8px 16px #bebebe, -8px -8px 16px #ffffff',
        'neuro-light-inset': 'inset 8px 8px 16px #bebebe, inset -8px -8px 16px #ffffff',
        'neuro-dark': '8px 8px 16px #1a1a1a, -8px -8px 16px #3e3e3e',
        'neuro-dark-inset': 'inset 8px 8px 16px #1a1a1a, inset -8px -8px 16px #3e3e3e',
      }
    },
  },
  plugins: [],
}