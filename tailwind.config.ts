import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--color-brand) / <alpha-value>)",
          strong: "rgb(var(--color-brand-strong) / <alpha-value>)",
          soft: "rgb(var(--color-brand-soft) / <alpha-value>)"
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          soft: "rgb(var(--color-success-soft) / <alpha-value>)"
        },
        pause: {
          DEFAULT: "rgb(var(--color-pause) / <alpha-value>)",
          soft: "rgb(var(--color-pause-soft) / <alpha-value>)"
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          soft: "rgb(var(--color-danger-soft) / <alpha-value>)"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "Segoe UI", "sans-serif"],
        serif: ["var(--font-display)", "Georgia", "serif"]
      },
      boxShadow: {
        panel: "0 18px 48px -28px rgba(30, 58, 95, 0.28)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(44, 74, 110, 0.18), transparent 34%), linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(235, 245, 250, 0.92))"
      }
    }
  },
  plugins: []
};

export default config;
