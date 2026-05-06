/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paw: {
          orange: '#F97316',
          'orange-hover': '#EA580C',
          'orange-light': '#FFF7ED',
          'orange-border': '#FDBA74',
          green: '#10B981',
          'green-light': '#ECFDF5',
          'green-border': '#6EE7B7',
          purple: '#8B5CF6',
          'purple-light': '#F5F3FF',
          teal: '#0D9488',
          'teal-light': '#F0FDFA',
          // Light theme
          bg: '#FAFAF9',
          'bg-card': '#FFFFFF',
          'bg-sidebar': '#FEFEFE',
          'bg-muted': '#F5F5F4',
          border: '#E7E5E4',
          'border-light': '#F5F5F4',
          text: '#1C1917',
          'text-secondary': '#57534E',
          'text-muted': '#A8A29E',
          danger: '#EF4444',
          'danger-light': '#FEF2F2',
          warning: '#F59E0B',
          'warning-light': '#FFFBEB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
