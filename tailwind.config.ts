// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        cs: {
          bg:      'var(--cs-bg)',
          surface: 'var(--cs-surface)',
          border:  'var(--cs-border)',
          text:    'var(--cs-text)',
          muted:   'var(--cs-muted)',
          accent:  'var(--cs-accent)',
          success: 'var(--cs-success)',
          danger:  'var(--cs-danger)',
          warning: 'var(--cs-warning)',
        },
      },
    },
  },
  plugins: [],
}

export default config
