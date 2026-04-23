/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'convexica-gold': '#d4af37',
        'deep-navy': '#0f172a',
        'charcoal': '#1e293b',
        'silver-text': '#e2e8f0',
        'slate-text': '#94a3b8',
        'inst-blue': '#1f77b4',
        'strat-orange': '#ff7f0e',
        'res-green': '#2ca02c',
        'risk-red': '#d62728',
        'white-subtle': 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
