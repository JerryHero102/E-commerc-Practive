/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: 'oklch(97% 0.02 259.719)',
          100: 'oklch(92% 0.04 259.719)',
          200: 'oklch(84% 0.08 259.719)',
          300: 'oklch(74% 0.12 259.719)',
          400: 'oklch(62% 0.15 259.719)',
          500: 'oklch(50% 0.17 259.719)',
          600: 'oklch(42.843% 0.17208 259.719)',
          650: 'oklch(38% 0.17208 259.719)',
          700: 'oklch(35% 0.17 259.719)',
          750: 'oklch(32% 0.17 259.719)',
          800: 'oklch(28% 0.17 259.719)',
          900: 'oklch(20% 0.15 259.719)',
          950: 'oklch(12% 0.10 259.719)',
        }
      },
      fontSize: {
        'xxs': '0.65rem',
      }
    },
  },
  plugins: [],
}
