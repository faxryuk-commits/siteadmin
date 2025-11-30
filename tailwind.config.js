/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          lightBlue: '#E8FBFF',
          lightTeal: '#CBE1DA',
          lightBeige: '#EEEADF',
          darkBlue: '#002A47',
          black: '#000000',
        },
        primary: {
          50: '#E8FBFF',
          100: '#CBE1DA',
          200: '#EEEADF',
          300: '#afdbd9',
          400: '#7db8b5',
          500: '#002A47',
          600: '#00223a',
          700: '#001a2d',
          800: '#001220',
          900: '#000a13',
        },
      },
      fontFamily: {
        sans: ['Aeronic Pro', 'system-ui', '-apple-system', 'sans-serif'],
        brand: ['Aeronic Pro', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #afdbd9 0%, #f3e9dd 100%)',
        'gradient-dark': 'linear-gradient(135deg, #002A47 0%, #001a2d 100%)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 42, 71, 0.08)',
        'medium': '0 4px 16px rgba(0, 42, 71, 0.12)',
        'large': '0 8px 32px rgba(0, 42, 71, 0.16)',
      },
    },
  },
  plugins: [],
}
