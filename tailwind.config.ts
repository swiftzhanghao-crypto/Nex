import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './**/*.{tsx,ts}',
    '!./node_modules/**',
    '!./dist/**',
    '!./.cursor/**',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        serif: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        primary: '#0071E3',
        'primary-dark': '#0A84FF',
        secondary: '#86868B',
        dark: '#1D1D1F',
        canvas: '#F5F2EC',
        'canvas-dark': '#000000',
        surface: '#FDFBF7',
        'surface-dark': '#1C1C1E',
      },
      boxShadow: {
        apple:
          '0 4px 24px -1px rgba(0, 0, 0, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        'apple-hover':
          '0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        glow: '0 0 20px rgba(0, 113, 227, 0.3)',
      },
      spacing: {
        page: 'var(--sp-page)',
        'page-lg': 'var(--sp-page-lg)',
        card: 'var(--sp-card)',
        'card-lg': 'var(--sp-card-lg)',
        section: 'var(--sp-section)',
        'section-lg': 'var(--sp-section-lg)',
        element: 'var(--sp-element)',
        'element-lg': 'var(--sp-element-lg)',
        gutter: 'var(--sp-gutter)',
        'gutter-lg': 'var(--sp-gutter-lg)',
        header: 'var(--layout-header-h)',
      },
      maxWidth: {
        content: 'var(--layout-content-max-w)',
      },
      width: {
        sidebar: 'var(--layout-sidebar-w)',
        'sidebar-collapsed': 'var(--layout-sidebar-collapsed-w)',
      },
      borderRadius: {
        card: 'var(--radius-xl)',
      },
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      gridColumn: {
        'span-13': 'span 13 / span 13',
        'span-14': 'span 14 / span 14',
        'span-15': 'span 15 / span 15',
        'span-16': 'span 16 / span 16',
        'span-17': 'span 17 / span 17',
        'span-18': 'span 18 / span 18',
        'span-19': 'span 19 / span 19',
        'span-20': 'span 20 / span 20',
        'span-21': 'span 21 / span 21',
        'span-22': 'span 22 / span 22',
        'span-23': 'span 23 / span 23',
        'span-24': 'span 24 / span 24',
      },
    },
  },
  plugins: [],
} satisfies Config;
