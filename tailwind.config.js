/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Soft optical serif for serene headings + numbers; humanist sans for UI.
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Water & sky — deep sea base with luminous horizon accents.
        sea: {
          900: '#06222b',
          800: '#08303d',
          700: '#0b414f',
          600: '#0f5868',
          500: '#15788a',
        },
        foam: '#cfeef0',
        glow: {
          cyan: '#5fd6d0',
          sky: '#8fc7e0',
          dawn: '#f4b88f',
        },
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      transitionTimingFunction: {
        // Heavy, settled spring — used for screen + card motion.
        fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
        // Symmetric breath easing for the orb.
        breath: 'cubic-bezier(0.45, 0, 0.55, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)', filter: 'blur(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        driftSlow: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -3%, 0) scale(1.08)' },
        },
        shimmer: {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.8s cubic-bezier(0.32,0.72,0,1) both',
        driftSlow: 'driftSlow 18s ease-in-out infinite',
        shimmer: 'shimmer 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
