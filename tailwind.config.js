/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Every color is a token from globals.css. Do not add new hex values here.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'ash-900': 'var(--ash-900)',
      'ash-800': 'var(--ash-800)',
      'ash-700': 'var(--ash-700)',
      oxblood: 'var(--oxblood)',
      blood: 'var(--blood)',
      'blood-hot': 'var(--blood-hot)',
      bile: 'var(--bile)',
      bone: 'var(--bone)',
      fog: 'var(--fog)',
    },
    // Fixed type scale: 11 / 13 / 15 / 20 / 28 / 44.
    fontSize: {
      xs: ['11px', { lineHeight: '1.36' }],
      sm: ['13px', { lineHeight: '1.54' }],
      base: ['15px', { lineHeight: '1.6' }],
      lg: ['20px', { lineHeight: '1.3' }],
      xl: ['28px', { lineHeight: '1.15' }],
      '2xl': ['44px', { lineHeight: '1.05' }],
    },
    // Sharp corners only — nothing above 2px.
    borderRadius: {
      none: '0',
      DEFAULT: '2px',
      sm: '1px',
    },
    extend: {
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      letterSpacing: {
        display: '-0.01em',
        label: '0.08em',
      },
      borderColor: {
        panel: 'var(--panel-border)',
      },
    },
  },
  plugins: [],
};
