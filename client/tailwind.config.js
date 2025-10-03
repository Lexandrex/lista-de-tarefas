/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: { '2xl': '1rem' },
      boxShadow: { card: '0 1px 4px rgba(0,0,0,.08)' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
