import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        accent: "var(--color-accent)",
        "accent-strong": "var(--color-accent-strong)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        ring: "var(--color-ring)",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.625rem",
      },
      boxShadow: {
        surface: "0 8px 30px -18px rgba(15, 23, 42, 0.35)",
      },
      fontFamily: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
      },
      maxWidth: {
        content: "70rem",
      },
      keyframes: {
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.98)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "sheet-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "sheet-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "toast-in": {
          from: { transform: "translateX(calc(100% + 1rem))" },
          to: { transform: "translateX(0)" },
        },
        "toast-out": {
          from: { transform: "translateX(var(--radix-toast-swipe-end-x, 0))", opacity: "1" },
          to: { transform: "translateX(calc(100% + 1rem))", opacity: "0" },
        },
        pop: {
          from: { opacity: "0", transform: "translateY(-2px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        skeleton: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "overlay-in": "overlay-in 120ms ease-out",
        "dialog-in": "dialog-in 160ms ease-out",
        "sheet-in": "sheet-in 200ms ease-out",
        "sheet-in-left": "sheet-in-left 200ms ease-out",
        "toast-in": "toast-in 180ms ease-out",
        "toast-out": "toast-out 180ms ease-in",
        pop: "pop 140ms ease-out",
        skeleton: "skeleton 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
