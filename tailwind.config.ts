import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.mdx",
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        sm: "600px",
        md: "768px",
        lg: "925px",
        xl: "1280px",
      },
      fontFamily: {
        serif: ["Newsreader", "Cormorant Garamond", "serif"],
        sans: ["Space Grotesk", "Avenir Next", "Segoe UI", "sans-serif"],
        mono: ["Monaco", "Consolas", "Lucida Console", "monospace"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
