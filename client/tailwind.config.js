/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        hand: ["'Patrick Hand'", "ui-rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sticky: "0 6px 16px -6px rgb(0 0 0 / 0.25)",
        "sticky-lg": "0 14px 32px -10px rgb(0 0 0 / 0.32)",
      },
    },
  },
  plugins: [],
};
