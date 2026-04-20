/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple:  '#5865F2',
          darkest:  '#0d0f12',
          darker:   '#1a1d23',
          dark:     '#23272a',
          medium:   '#2c2f33',
          light:    '#36393f',
          muted:    '#72767d',
          white:    '#ffffff',
          green:    '#57F287',
          yellow:   '#FEE75C',
          red:      '#ED4245',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
