/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-purple": "#6C5CE7",
        "brand-dark": "#000300",   // your preferred bg
        "brand-accent": "#FFB347",
      },
    },
  },
  plugins: [],
};
