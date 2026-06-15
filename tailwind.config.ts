import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: '#07192B',
          secondary: '#2A3A4E',
        },
        gold: {
          DEFAULT: '#D4A437',
          light: '#E3C36F',
        },
        surface: {
          gray: '#F5F7FA',
        },
      },
      boxShadow: {
        premium: '0 20px 45px rgba(7, 25, 43, 0.24)',
        card: '0 12px 28px rgba(10, 25, 48, 0.12)',
      },
      fontFamily: {
        sans: ['Open Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
