/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        brand: "#ea580c",
        "brand-dark": "#c2410c",
        cream: "#fff7ed",
        surface: "#f6f6f7",
      },
    },
  },
  plugins: [],
};
