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
        sidebar: "1024px",
      },
      fontFamily: {
        serif: ["Newsreader", "Cormorant Garamond", "serif"],
        sans: ["Space Grotesk", "Avenir Next", "Segoe UI", "sans-serif"],
        mono: ["Monaco", "Consolas", "Lucida Console", "monospace"],
      },
      fontSize: {
        "type-1": ["2.441em", { lineHeight: "1.2" }],
        "type-2": ["1.953em", { lineHeight: "1.2" }],
        "type-3": ["1.563em", { lineHeight: "1.2" }],
        "type-4": ["1.25em", { lineHeight: "1.3" }],
        "type-5": ["1em", { lineHeight: "1.5" }],
        "type-6": ["0.75em", { lineHeight: "1.5" }],
        "type-7": ["0.6875em", { lineHeight: "1.5" }],
        "type-8": ["0.625em", { lineHeight: "1.5" }],
      },
      colors: {
        homeBg: {
          0: "#06080d",
          1: "#0a0f17",
          2: "#0f1620",
        },
        homeBorder: "rgba(166, 182, 206, 0.12)",
        homeBorderSoft: "rgba(166, 182, 206, 0.08)",
        homeText: {
          main: "#e7edf8",
          muted: "rgba(202, 212, 228, 0.88)",
        },
        homeCard: {
          bg: "rgba(10, 16, 25, 0.2)",
          strong: "rgba(10, 15, 24, 0.42)",
        },
        homeNav: {
          bg: "rgba(6, 8, 13, 0.78)",
        },
        btnPrimary: {
          text: "#0e1521",
          border: "rgba(221, 229, 243, 0.72)",
          from: "#dde6f5",
          to: "#bfccdf",
        },
        btnSecondary: {
          text: "#dde7f6",
          border: "rgba(161, 176, 201, 0.44)",
          bg: "rgba(17, 24, 36, 0.84)",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "typed-caret": "typed-caret 0.9s steps(1) infinite",
        "hero-aurora": "hero-aurora 12s ease-in-out infinite alternate",
        reveal: "reveal 460ms ease forwards",
        "avatar-glow": "avatar-glow 6s ease-in-out infinite",
      },
      keyframes: {
        "typed-caret": {
          "0%, 49%": { borderRightColor: "rgba(202, 216, 238, 0.82)" },
          "50%, 100%": { borderRightColor: "transparent" },
        },
        "hero-aurora": {
          "0%": { transform: "translate(-1%, -1%) scale(1)" },
          "50%": { transform: "translate(1%, 2%) scale(1.03)" },
          "100%": { transform: "translate(-1%, 1%) scale(1.01)" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "avatar-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 24px rgba(140,160,200,0.32), 0 0 48px rgba(120,140,180,0.16), 0 0 80px rgba(100,120,160,0.08)",
            opacity: "1",
          },
          "50%": {
            boxShadow:
              "0 0 40px rgba(160,180,220,0.48), 0 0 72px rgba(140,160,200,0.26), 0 0 110px rgba(120,140,180,0.14)",
            opacity: "0.85",
          },
        },
      },
      borderRadius: {
        card: "0.85rem",
        btn: "0.7rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
