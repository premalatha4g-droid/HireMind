/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAF9F6',       // Premium Ivory page background
          primary: '#4F46E5',  // Indigo primary brand accent
          indigo: '#4F46E5',   // Indigo
          emerald: '#10B981',  // Emerald for verified/success
          amber: '#F59E0B',    // Amber warning
          rose: '#EF4444',     // Rose error
          violet: '#7C3AED',   // Violet/purple AI accents
          charcoal: '#0F172A', // Slate/charcoal typography
          border: '#E2E8F0',   // Thin borders
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
