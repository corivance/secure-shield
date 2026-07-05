/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ONLY the sanctioned SecureShield palette (see CLAUDE.MD). Lightening is
      // done with opacity utilities — never with new hex values.
      colors: {
        ink: '#000000', // Black
        charcoal: '#73787C', // Charcoal
        gray: { DEFAULT: '#C5C6C7' }, // Gray
        paleblue: '#D7E5F0', // Pale Blue
        beige: '#C9AD93', // Beige
        taupe: '#554940', // Taupe
        softgreen: '#879A77', // Soft Green
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Geometric, minimalist display (swap to Montserrat/Lato here if preferred).
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: { tightish: '-0.02em', eyebrow: '0.22em' },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.03), 0 14px 34px -20px rgba(85,73,64,0.28)',
        lift: '0 2px 6px rgba(0,0,0,0.04), 0 28px 54px -22px rgba(85,73,64,0.42)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      borderRadius: { '4xl': '28px' },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
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
        rise: 'rise 0.55s cubic-bezier(0.2,0.7,0.2,1) both',
        dot: 'dot 1.8s ease-in-out infinite',
        sweep: 'sweep 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
