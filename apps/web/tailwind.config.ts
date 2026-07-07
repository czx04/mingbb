import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          500: "#1570ef",
          600: "#175cd3",
          900: "#102a56"
        }
      }
    }
  },
  plugins: []
};

export default config;
