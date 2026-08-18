/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './services/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          50: '#FDFBF7',
          100: '#FAF4EB',
          200: '#F3E8D7',
          300: '#E6D3BA',
          400: '#D4B692',
          500: '#BA9267',
          600: '#9E744A',
          700: '#7E5936',
          800: '#5F4127',
          900: '#3D2817',
          950: '#23150B',
        },
        caramel: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        espresso: {
          50: '#F6F5F4',
          100: '#ECE9E6',
          200: '#D8D3CD',
          300: '#BFB6AD',
          400: '#9B8E82',
          500: '#7B6E62',
          600: '#5F544B',
          700: '#463D37',
          800: '#2F2925',
          900: '#1C1816',
          950: '#0F0C0A',
        },
        status: {
          instock: '#10B981',
          'instock-bg': '#ECFDF5',
          'instock-border': '#A7F3D0',
          lowstock: '#F59E0B',
          'lowstock-bg': '#FFFBEB',
          'lowstock-border': '#FDE68A',
          outofstock: '#EF4444',
          'outofstock-bg': '#FEF2F2',
          'outofstock-border': '#FECACA',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cafe-sm': '0 1px 3px rgba(35, 21, 11, 0.05), 0 1px 2px rgba(35, 21, 11, 0.03)',
        'cafe-md': '0 4px 12px -2px rgba(35, 21, 11, 0.08), 0 2px 6px -1px rgba(35, 21, 11, 0.04)',
        'cafe-lg': '0 12px 28px -4px rgba(35, 21, 11, 0.12), 0 4px 12px -2px rgba(35, 21, 11, 0.06)',
        'cafe-xl': '0 20px 40px -8px rgba(35, 21, 11, 0.16), 0 8px 16px -4px rgba(35, 21, 11, 0.08)',
        'caramel-glow': '0 0 24px -4px rgba(217, 119, 6, 0.35)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.65', transform: 'scale(0.96)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out',
      }
    },
  },
  plugins: [],
};
