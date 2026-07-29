export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#00D98B',
        brandDark: '#0F172A',
        brandLight: '#E2FCEF',
        bgMain: '#F8FAFC',
        bgSec: '#FFFFFF',
        textMain: '#0F172A',
        textSec: '#64748B',
        card: '#FFFFFF',
        borderDark: '#E2E8F0',
        cyan: '#06B6D4',
        purple: '#8B5CF6',
        rose: '#F43F5E',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
