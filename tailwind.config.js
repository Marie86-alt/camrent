/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cameroonGreen: '#15803d',
        cameroonRed: '#b91c1c',
        cameroonYellow: '#facc15',
      },
    },
  },
  plugins: [],
};
