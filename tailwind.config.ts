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
        ink: "#101826",
        sand: "#f4efe7",
        tide: "#dbe7e4",
        reef: "#0e8f78",
        amberline: "#c7841f",
        berry: "#7f1d3e",
        sky: "#2563eb",
        night: "#09111f"
      },
      boxShadow: {
        card: "0 24px 70px rgba(16, 24, 38, 0.10)"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(16, 24, 38, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 24, 38, 0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
