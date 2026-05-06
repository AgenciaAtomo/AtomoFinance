import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── PALETA ÁTOMO ──────────────────────────────
        primary: {
          DEFAULT: '#1A1A2E',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#00C853',
          hover: '#007B33',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#0D7377',
          foreground: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#E8F5E9',
        },
        bg: '#F5F7FA',
        muted: '#4A5568',
        border: '#E0E4EA',
        danger: '#E53E3E',
        warning: '#D69E2E',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
