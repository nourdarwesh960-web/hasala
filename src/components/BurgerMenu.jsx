import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS } from '../lib/constants';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
export function BurgerMenu() {
  const { t, page, setPage, lang, update, state } = useApp();
  const [open, setOpen] = useState(false);
  const name = state.profile.name;
  const photo = state.profile.photo;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    if (open) {
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }
  }, [open]);
  const go = (id) => {
    setPage(id);
    setOpen(false);
  };
  const toggleLang = () => update((s) => ({ settings: { ...s.settings, lang: lang === 'ar' ? 'en' : 'ar' } }));
  return (
    <>
      <button
        className={'burger-btn ' + (open ? 'open' : '')}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        style={{ position: 'fixed', top: '12px', insetInlineStart: 'var(--burger-start, 12px)', zIndex: 100 }}
      >
        <span className="bar bar-1"></span>
        <span className="bar bar-2"></span>
        <span className="bar bar-3"></span>
      </button>
      <div
        className={'burger-overlay ' + (open ? 'open' : '')}
        onClick={() => setOpen(false)}
      />
      <div
        className={'burger-panel ' + (open ? 'open' : '')}
        role="dialog"
        aria-modal="true"
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <div className="burger-header">
          <div className="brand">
            <div className="brand-icon">
              <Icon name="wallet" size={18} sw={2} />
            </div>
            <div>
              <div className="brand-name">{t('app.name')}</div>
              <div className="brand-tag">{t('app.tagline')}</div>
            </div>
          </div>
          <button className="lang-btn" onClick={toggleLang}>
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        </div>
        {(name || photo) && (
          <div style={{
            width: '100%', maxWidth: 420, marginBottom: 16, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface-2)', borderRadius: 16,
            border: '1px solid var(--line)',
          }}>
            <Avatar photo={photo} name={name} size={44} rounded="rounded-full" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{name || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t('app.tagline')}</div>
            </div>
          </div>
        )}
        <nav className={'burger-menu burger-menu-list'}>
          {NAV_ITEMS.map((item, i) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                className={'burger-menu-item ' + (active ? 'active' : '')}
                onClick={() => go(item.id)}
                style={{ animationDelay: (0.04 + i * 0.035) + 's' }}
              >
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <Icon name={item.icon} size={22} sw={active ? 2.2 : 1.8} className="ico" />
                <span className="label">{t(item.label)}</span>
              </button>
            );
          })}
        </nav>
        <div className="burger-footer">
          {t('landing.footer')}
        </div>
      </div>
    </>
  );
}