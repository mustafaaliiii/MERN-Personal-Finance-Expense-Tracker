/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // scans all your React files
  ],
  darkMode: 'class', // enable dark mode using a CSS class
  theme: {
    extend: {
      colors: {
        primary: "#875cf5",   // purple
      },
    },
  },
  plugins: [],
};
