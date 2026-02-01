/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0284c7", // اللون الأساسي اللي هنستخدمه بدل الأخضر
          light: "#38bdf8",
          dark: "#0369a1",
        },
      },
    },
  },
  plugins: [],
};
