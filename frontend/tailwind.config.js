export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1B5E20',          // Deep forest green
        'primary-light': '#2E7D32',    // Medium green
        accent: '#66BB6A',           // Light green
        gold: '#F9A825',             // Harvest gold
        earth: '#5D4037',            // Soil brown
        sky: '#0288D1',              // Sky blue
        cream: '#F9F6F0',            // Natural cream
        surface: '#FFFFFF',          // White cards
        'text-dark': '#1A2E1A',      // Dark text
        'text-muted': '#546E7A',     // Muted text
        success: '#2E7D32',          // Green
        warning: '#F57F17',          // Amber
        error: '#C62828',            // Red

        // Compatibility mappings
        brandDark: '#1A2E1A',
        brandLight: '#E8F5E9',
        bgMain: '#F1F8E9',
        bgSec: '#FFFFFF',
        textMain: '#1A2E1A',
        textSec: '#546E7A',
        card: '#FFFFFF',
        borderDark: '#E0E7DE',
        rose: '#C62828',
      },
      fontFamily: { 
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'sans-serif'] 
      },
      boxShadow: {
        'farm-sm': '0 2px 10px rgba(27, 94, 32, 0.05)',
        'farm-md': '0 4px 20px rgba(27, 94, 32, 0.08)',
        'farm-lg': '0 12px 40px rgba(27, 94, 32, 0.15)',
      }
    },
  },
  plugins: [],
}
