/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#3B63D4',
        'brand-blue-dark': '#2a4db8',
        'brand-danger': '#b91c1c',
        'brand-warning': '#facc15',
      },
    },
  },
  plugins: [],
};
