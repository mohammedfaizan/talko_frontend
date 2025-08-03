/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import scrollbar from "tailwind-scrollbar";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui, scrollbar],
  daisyui: {
    themes: ["retro", "dark"], // <-- Add this line
  },
};
