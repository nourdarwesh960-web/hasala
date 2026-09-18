import { useEffect } from 'react';
import { Icon } from './Icon';
export function Card({ className = '', children, ...rest }) {
  return <div className={'card rounded-2xl ' + className} {...rest}>{children}</div>;
}
export function Btn({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const base = 'press inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap';
  const sizes = { sm: 'h-9 px-3 text-[13px]', md: 'h-11 px-4 text-sm', lg: 'h-13 px-6 text-[15px]' };
  const variants = {
    primary: 'bg-accent text-white hover:opacity-90 dark:text-[#04150E]',
    secondary: 'bg-surface2 text-ink hover:bg-line border border-line',
    ghost: 'text-muted hover:text-ink hover:bg-surface2',
    danger: 'bg-dangerSoft text-danger hover:opacity-80',
    outline: 'border border-line text-ink hover:bg-surface2',
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>{children}</button>;
}
export function IconBtn({ name, className = '', size = 18, ...rest }) {
  return (
    <button className={'press grid place-items-center w-9 h-9 rounded-xl text-muted hover:text-ink hover:bg-surface2 transition ' + className} {...rest}>
      <Icon name={name} size={size} />
    </button>
  );
}
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={'block ' + className}>
      {label && <span className="block text-[12px] font-semibold text-muted mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  );
}
export function Input({ className = '', ...rest }) {
  return <input className={'field w-full h-11 px-3.5 rounded-xl text-[15px] text-ink placeholder:text-muted/70 ' + className} {...rest} />;
}
export function Select({ className = '', children, ...rest }) {
  return (
    <select
      className={'field w-full h-11 px-3 rounded-xl text-[15px] text-ink appearance-none bg-no-repeat ' + className}
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: '2.25rem',
      }}
      {...rest}
    >{children}</select>
  );
}
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] anim-fade" onClick={onClose} />
      <div className={'relative w-full ' + widths[size] + ' bg-surface border border-line rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col anim-sheet'}>
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <h3 className="text-[17px] font-bold text-ink">{title}</h3>
            <IconBtn name="x" onClick={onClose} />
          </div>
        )}
        <div className="px-5 pb-5 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
export function EmptyState({ icon, title, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 anim-rise">
      <div className="w-14 h-14 rounded-2xl bg-surface2 grid place-items-center text-2xl mb-4">{icon}</div>
      <p className="text-[15px] text-muted mb-4 max-w-xs">{title}</p>
      {action && <Btn onClick={action} variant="secondary" size="sm">{actionLabel}</Btn>}
    </div>
  );
}
export function Progress({ value, color = 'var(--accent)', height = 8, className = '' }) {
  const p = Math.min(100, Math.max(0, value));
  return (
    <div className={'w-full rounded-full bg-surface2 overflow-hidden ' + className} style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: p + '%', background: color }} />
    </div>
  );
}
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={'inline-flex p-1 rounded-xl bg-surface2 ' + className}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={'press px-3 h-8 rounded-lg text-[13px] font-semibold transition ' +
            (value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Toast({ toast }) {
  if (!toast) return null;
  const tones = {
    good: 'bg-accent',
    bad: 'bg-danger',
    neutral: '',
  };
  return (
    <div className="toast-fix-container fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 z-[200] anim-pop">
      <div className={'toast-fix px-4 py-3 rounded-2xl text-[13.5px] font-semibold flex items-center gap-3 ' + (tones[toast.tone] || '')}>
        <span className="grow">{toast.msg}</span>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="press font-extrabold underline underline-offset-2 whitespace-nowrap hover:opacity-80 shrink-0"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}