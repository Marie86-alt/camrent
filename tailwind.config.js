/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ─── Design system tokens ───────────────────────────────────────
        primary: {
          50:  '#EEF2FD',
          100: '#D8E1FB',
          500: '#5277E0',
          600: '#3B63D4',
          700: '#2E4FB0',
          900: '#1B2E66',
        },
        accent: {
          50:  '#FFF7ED',
          500: '#F59E0B',
          600: '#E8900A',
        },
        success: { DEFAULT: '#16A34A', light: '#E8F5EC' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB' },
        danger:  { DEFAULT: '#DC2626', light: '#FEF2F2' },
        info:    { DEFAULT: '#0077B6', light: '#E0F0FA' },

        // ─── Backward-compat aliases (code existant) ────────────────────
        'brand-blue':      '#3B63D4',
        'brand-blue-dark': '#2A4DB8',
        'brand-danger':    '#b91c1c',
        'brand-warning':   '#facc15',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      fontFamily: {
        sans:          ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semi':   ['Inter_600SemiBold'],
        'sans-bold':   ['Inter_700Bold'],
        'sans-xbold':  ['Inter_800ExtraBold'],
        display:       ['Sora_700Bold'],
      },
    },
  },
  plugins: [],
};
