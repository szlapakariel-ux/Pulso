import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pulso: {
          bg: "#FAF7F2",
          ink: "#1F2937",
          soft: "#6B7280",
          accent: "#5B7FFF",
          mute: "#E7E2D8",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
      },
    },
  },
  plugins: [],
};

export default config;
