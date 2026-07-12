/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        ink: '#1E293B',
        charcoal: '#64748B',
        muted: '#94A3B8',
        border: '#E2E8F0',
        surface: '#F8FAFC',
        softgreen: '#879A77',
        beige: '#C9AD93',
        taupe: '#554940',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: { tightish: '-0.02em', eyebrow: '0.12em' },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.02)',
        card: '0 4px 20px rgba(0,0,0,0.02)',
        lift: '0 8px 30px rgba(0,0,0,0.06)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.25rem' },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dot: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        rise: 'rise 0.3s ease-out both',
        dot: 'dot 1.8s ease-in-out infinite',
        sweep: 'sweep 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
