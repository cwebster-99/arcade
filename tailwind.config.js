/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        'crossword-5': 'repeat(5, 1fr)',
        'crossword-7': 'repeat(7, 1fr)',
      },
      aspectRatio: {
        'square': '1 / 1',
      }
    },
  },
  plugins: [],
}

