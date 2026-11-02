import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaf2ff",
          100: "#dbe8ff",
          200: "#c7dbfb",
          300: "#9bbbf5",
          400: "#6e9bea",
          500: "#4f8bee",
          600: "#3978e8",
          700: "#245fc9",
          800: "#1e4fa8",
          900: "#173d80",
        },
        ink: {
          900: "#17243a",
          700: "#35465f",
          500: "#65758b",
          400: "#8b98aa",
          300: "#9aa6b6",
        },
        canvas: "#f6f8fc",
        line: "#e7edf5",
        navy: {
          950: "#111b2b",
          900: "#17243a",
          800: "#1d2b42",
          700: "#283b58",
          600: "#35465f",
        },
        lavender: {
          50: "#f7f5ff",
          100: "#f0edff",
          200: "#e4defc",
          300: "#d3c9fa",
          400: "#b7a6f2",
          500: "#7962cf",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 8px 28px rgba(25, 48, 82, 0.055)",
      },
    },
  },
  plugins: [],
};
export default config;
