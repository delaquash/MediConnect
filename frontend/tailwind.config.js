/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5F6FFF',
        'primary-dark': '#4a52cc', // adjust to your desired dark shade
      },
    },
  },
  plugins: [],
}
