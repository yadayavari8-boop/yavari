import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Kurdish Green — primary brand color
        brand: {
          50: "#E6F4EC",
          100: "#C1E4D0",
          200: "#8FCCAA",
          300: "#4FAE7B",
          400: "#1C9257",
          500: "#007A3D", // primary
          600: "#046835",
          700: "#08532C",
          800: "#0A4224",
          900: "#08301B",
        },
        // Sun / gold accent — echoes the sun emblem on the Kurdistan flag,
        // reserved for "Featured / VIP" signals only
        sun: {
          400: "#FFCF4D",
          500: "#FDB913",
          600: "#E29E00",
        },
        canvas: "#F9FAFB",
        ink: "#111827",
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Noto Sans Arabic", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.06), 0 1px 6px rgba(17,24,39,0.05)",
        cardHover: "0 4px 14px rgba(17,24,39,0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
