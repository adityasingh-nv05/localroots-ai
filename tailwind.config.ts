import type { Config } from 'tailwindcss';

const config: Config = {
  // Scan all of src so classes used in lib/ (e.g. tone maps) are generated.
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'spin-slow-reverse': { to: { transform: 'rotate(-360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
        'spin-slow': 'spin-slow 90s linear infinite',
        'spin-slow-reverse': 'spin-slow-reverse 120s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
