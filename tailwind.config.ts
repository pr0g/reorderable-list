import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ['DepartureMono', 'sans-serif'],
    },
    extend: {}
  },
  plugins: []
} satisfies Config;
