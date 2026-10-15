import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./frontend/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./frontend/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./frontend/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;