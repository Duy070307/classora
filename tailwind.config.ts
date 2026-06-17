import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        muted: "#647084",
        line: "#e6eaf0",
        brand: "#2563eb",
        mint: "#10b981",
        coral: "#f97316"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(24, 33, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
