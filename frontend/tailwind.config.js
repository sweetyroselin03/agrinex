export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // AgriNex AI Strict Brand Color Palette
        'green-deep':   '#123B24',
        'green-mid':    '#185C2B',
        'green-light':  '#1F7A36',
        accent:         '#6BCB45',
        'accent-soft':  '#A7D96A',
        cream:          '#F5F7EF',
        'cream-dark':   '#EEF3E8',
        soil:           '#8B6B45',
        sky:            '#6FA8C9',
        text:           '#1A2E1A',
        'text-muted':   '#546E7A',
        white:          '#FFFFFF',
        gold:           '#F9A825',
        'gold-light':   '#FFE082',

        // Legacy / Standard Mappings
        primary:        '#123B24',
        'primary-mid':  '#185C2B',
        'primary-light':'#1F7A36',
        'accent-light': '#A7D96A',
        surface:        '#FFFFFF',
        'text-dark':    '#1A2E1A',
        success:        '#185C2B',
        warning:        '#F57C00',
        error:          '#C62828',
        bgMain:         '#F5F7EF',
      },

      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },

      borderRadius: {
        'xl':   '12px',
        '2xl':  '16px',
        '3xl':  '20px',
        '4xl':  '24px',
        '5xl':  '32px',
      },

      boxShadow: {
        'farm-sm':  '0 2px 10px rgba(18,59,36,0.06)',
        'farm-md':  '0 4px 20px rgba(18,59,36,0.08)',
        'farm-lg':  '0 8px 32px rgba(18,59,36,0.12)',
        'farm-xl':  '0 16px 48px rgba(18,59,36,0.16)',
        'glass':    '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)',
        'glass-dark':'0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'gold':     '0 4px 20px rgba(249,168,37,0.35)',
        'glow-green':'0 0 30px rgba(107,203,69,0.4)',
      },
    },
  },
  plugins: [],
}
