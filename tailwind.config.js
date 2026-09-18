export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        accentSoft: 'var(--accent-soft)',
        danger: 'var(--danger)',
        dangerSoft: 'var(--danger-soft)',
        warn: 'var(--warn)',
        warnSoft: 'var(--warn-soft)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Arabic', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};