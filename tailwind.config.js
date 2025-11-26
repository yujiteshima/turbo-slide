/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./slides/**/*.html",
    "./views/**/*.html",
    "./templates/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'slide-primary': '#0d9488',
        'slide-secondary': '#06b6d4',
        'slide-accent': '#f97316',
        'slide-warning': '#d97706'
      },
      aspectRatio: {
        'slide': '16 / 9'
      }
    }
  },
  plugins: []
}
