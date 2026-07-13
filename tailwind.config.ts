import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        panel: "#f7f9f6",
        line: "#dbe3dd",
        gain: "#087a3d",
        loss: "#b42318",
        amber: "#a15c04"
      },
      fontFamily: {
        sans: ["Inter", "Arial", "Helvetica", "sans-serif"],
        mono: ["Roboto Mono", "Consolas", "monospace"]
      },
      boxShadow: {
        table: "0 1px 0 rgba(23, 33, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
