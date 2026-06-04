/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        rose: {
          DEFAULT: 'hsl(340, 55%, 62%)',
          50:  'hsl(340, 60%, 97%)',
          100: 'hsl(340, 55%, 93%)',
          200: 'hsl(340, 52%, 86%)',
          300: 'hsl(340, 55%, 76%)',
          400: 'hsl(340, 55%, 68%)',
          500: 'hsl(340, 55%, 62%)',
          600: 'hsl(340, 50%, 54%)',
          700: 'hsl(340, 48%, 44%)',
          800: 'hsl(340, 44%, 34%)',
          900: 'hsl(340, 40%, 24%)',
        },
        gold: {
          DEFAULT: 'hsl(42, 72%, 50%)',
          50:  'hsl(42, 80%, 97%)',
          100: 'hsl(42, 78%, 90%)',
          200: 'hsl(42, 76%, 80%)',
          300: 'hsl(42, 74%, 70%)',
          400: 'hsl(42, 73%, 60%)',
          500: 'hsl(42, 72%, 50%)',
          600: 'hsl(42, 70%, 42%)',
          700: 'hsl(42, 68%, 34%)',
          800: 'hsl(42, 64%, 26%)',
          900: 'hsl(42, 60%, 18%)',
        },
        luxury: {
          black: 'hsl(0, 0%, 4%)',
          dark: 'hsl(0, 0%, 8%)',
          surface: 'hsl(0, 0%, 12%)',
          muted: 'hsl(0, 0%, 16%)',
        },
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, hsl(340,55%,62%) 0%, hsl(42,72%,50%) 100%)',
        'gradient-gold': 'linear-gradient(135deg, hsl(42,76%,60%) 0%, hsl(42,60%,40%) 100%)',
        'gradient-dark': 'linear-gradient(135deg, hsl(0,0%,8%) 0%, hsl(0,0%,4%) 100%)',
        'gradient-rose': 'linear-gradient(135deg, hsl(340,60%,97%) 0%, hsl(340,55%,93%) 100%)',
      },
      boxShadow: {
        'luxury': '0 4px 24px hsla(340, 40%, 50%, 0.10)',
        'luxury-md': '0 8px 40px hsla(340, 40%, 50%, 0.15)',
        'luxury-lg': '0 16px 64px hsla(340, 40%, 50%, 0.20)',
        'gold': '0 4px 24px hsla(42, 72%, 50%, 0.20)',
        'gold-md': '0 8px 40px hsla(42, 72%, 50%, 0.30)',
        'card': '0 2px 16px hsla(340, 30%, 40%, 0.08)',
        'card-hover': '0 8px 32px hsla(340, 30%, 40%, 0.14)',
        'dark-card': '0 2px 16px hsla(0, 0%, 0%, 0.4)',
        'dark-card-hover': '0 8px 32px hsla(42, 72%, 50%, 0.15)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 hsla(42, 72%, 50%, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px hsla(42, 72%, 50%, 0)' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      borderRadius: {
        'luxury': '16px',
        'luxury-lg': '24px',
        'luxury-xl': '32px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}
