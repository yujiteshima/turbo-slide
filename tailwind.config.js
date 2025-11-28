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
        'slide-primary': '#1e293b',    // Slate 800 - ダークグレー（メインカラー）
        'slide-secondary': '#64748b',  // Slate 500 - ミディアムグレー（セカンダリ）
        'slide-accent': '#3b82f6',     // Blue 500 - クリアな青（アクセント）
        'slide-warning': '#60a5fa'     // Blue 400 - ライトブルー（強調）
      },
      aspectRatio: {
        'slide': '16 / 9'
      }
    }
  },
  plugins: []
}
