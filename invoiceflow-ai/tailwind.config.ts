import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        austin: {
          teal: "#0f4c5c",
          orange: "#f4a261",
          offwhite: "#f8f9fa",
          sage: "#87a96b",
        },
        primary: "#f4a261",
        secondary: "#0f4c5c",
        accent: "#87a96b",
        background: "#f8f9fa",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      fontSize: {
        body: ["14px", "1.25"],
        "body-lg": ["18px", "1.25"],
        "h1": ["52px", "1.25"],
        "h2": ["40px", "1.25"],
        "h3": ["28px", "1.25"],
      },
      borderRadius: {
        austin: "16px",
      },
      boxShadow: {
        neumorph: "inset 2px 2px 4px rgba(0,0,0,0.06)",
        "neumorph-lg": "inset 3px 3px 6px rgba(0,0,0,0.08)",
      },
      maxWidth: {
        content: "1100px",
      },
      spacing: {
        gutter: "40px",
      },
    },
  },
  plugins: [],
};

export default config;
