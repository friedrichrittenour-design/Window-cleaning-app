import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0a0a2a",
        electric: {
          DEFAULT: "#00c8ff",
          dark: "#0055ff",
        },
        pink: {
          neon: "#ff2fd0",
        },
        yellow: {
          neon: "#fff200",
        },
        green: {
          neon: "#39ff14",
        },
        purple: {
          neon: "#b026ff",
        },
      },
      fontFamily: {
        display: ['"Arial Black"', "Arial Bold", "Impact", "sans-serif"],
        body: ["Verdana", "Geneva", '"Trebuchet MS"', "sans-serif"],
      },
      boxShadow: {
        hard: "6px 6px 0 #000000",
        "hard-sm": "4px 4px 0 #000000",
        "hard-active": "2px 2px 0 #000000",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
