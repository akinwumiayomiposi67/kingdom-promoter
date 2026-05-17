/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        accent: "#f59e0b",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1a3c6e",
          950: "#0f2d5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)",
        "card-md": "0 4px 12px rgba(0,0,0,0.08)",
        "card-lg": "0 10px 24px rgba(0,0,0,0.10)",
        glow: "0 0 20px rgba(59,130,246,0.25)",
      },
      backgroundImage: {
        sidebar: "linear-gradient(180deg,#0f2d5e 0%,#1a3c6e 55%,#1d4ed8 100%)",
        hero: "linear-gradient(135deg,#0f2d5e 0%,#1e40af 60%,#059669 100%)",
        gold: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
