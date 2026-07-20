/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lc: {
          dark: '#0d0a1a',
          card: 'rgba(255,255,255,0.04)',
          orange: '#FF8F00',
          fire: '#FF5722',
          pink: '#E91E8C',
          purple: '#9C27B0',
          blue: '#1565C0',
          'blue-light': '#42A5F5',
          yellow: '#FFC107',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FFC107 0%, #FF5722 40%, #E91E8C 80%, #9C27B0 100%)',
        'blue-gradient': 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
      }
    },
  },
  plugins: [],
}
