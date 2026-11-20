import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#12212B", mist: "#F2F5F6", line: "#D5DEE2", pine: "#0E5A4F", gold: "#E3A008" } } },
} satisfies Config;
