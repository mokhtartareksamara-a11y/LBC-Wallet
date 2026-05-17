/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core palette
        background: '#0d0d14',       // Deep navy-black
        surface: '#12121e',          // Card surface
        'surface-raised': '#1a1a2e', // Elevated surface
        primary: '#6366f1',          // Indigo accent
        'primary-hover': '#4f46e5',  // Indigo hover
        gold: '#d4af37',             // Luxury gold
        'gold-light': '#f5e27a',     // Light gold highlight
        emerald: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
        // Semantic
        verified: '#10b981',  // Emerald — verified purchase
        travel: '#3b82f6',    // Blue   — travel posts
        achievement: '#f59e0b', // Amber — achievement posts
      },
      backgroundImage: {
        // Glassmorphism helpers
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #d4af37 0%, #f5e27a 50%, #d4af37 100%)',
        'feed-bg': 'radial-gradient(ellipse at top, #1a1a3e 0%, #0d0d14 60%)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        heavy: '32px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
        'glass-hover': '0 12px 48px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255,255,255,0.10)',
        'gold-glow': '0 0 24px rgba(212, 175, 55, 0.35)',
        'verified-glow': '0 0 16px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionDuration: {
        350: '350ms',
        400: '400ms',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
