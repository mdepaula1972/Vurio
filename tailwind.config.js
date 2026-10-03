/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        vurio: {
          navy: "#052d6b",
          dark: "#001c4e",
          midnight: "#040c18",
          blue: "#0077d1",
          sky: "#0099ff",
          cyan: "#02c1db",
          teal: "#00d2c4",
          pulse: "#01cf9e",
          ice: "#f3f8fc",
        },
        brand: {
          50: "#f0fbfd",
          100: "#d9f4fa",
          200: "#b5ebf5",
          300: "#80dded",
          400: "#3cc8df",
          500: "#02c1db",
          600: "#0077d1",
          700: "#052d6b",
          800: "#001c4e",
          900: "#040c18",
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(2, 193, 219, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(0, 119, 209, 0.4)',
        'glow-pulse': '0 0 25px -5px rgba(1, 207, 158, 0.4)',
      }
    },
  },
  plugins: [],
};
