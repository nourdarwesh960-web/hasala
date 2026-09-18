import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
export function ThemeToggle({ className = '' }) {
  const { state, update } = useApp();
  const theme = state.settings.theme || 'dark';
  const cycle = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    update((s) => ({ settings: { ...s.settings, theme: next } }));
  };
  const titles = { dark: 'Dark', light: 'Light', system: 'System' };
  return (
    <button
      onClick={cycle}
      title={titles[theme]}
      aria-label={titles[theme]}
      className={
        'press relative h-10 w-10 rounded-xl bg-surface2 border border-line text-muted hover:text-ink transition overflow-hidden grid place-items-center ' +
        className
      }
    >
      <span
        className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{
          transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
          opacity: theme === 'dark' ? 1 : 0,
        }}>
        <Icon name="moon" size={17} />
      </span>
      <span
        className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{
          transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
          opacity: theme === 'light' ? 1 : 0,
        }}>
        <Icon name="sun" size={17} />
      </span>
      <span
        className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{
          transform: theme === 'system' ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)',
          opacity: theme === 'system' ? 1 : 0,
        }}>
        <Icon name="settings" size={16} />
      </span>
    </button>
  );
}