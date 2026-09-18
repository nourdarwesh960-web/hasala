import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
export function NotifPanel({ open, onClose }) {
  const { notifications, t, update } = useApp();
  if (!open) return null;
  const tones = {
    bad: { bg: 'bg-dangerSoft', fg: 'text-danger' },
    warn: { bg: 'bg-warnSoft', fg: 'text-warn' },
    good: { bg: 'bg-accentSoft', fg: 'text-accent' },
    info: { bg: 'bg-surface2', fg: 'text-muted' },
  };
  return (
    <div className="fixed inset-0 z-[95]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 anim-fade" />
      <div className="absolute top-16 end-4 w-[min(380px,calc(100vw-2rem))] bg-surface border border-line rounded-2xl shadow-xl overflow-hidden anim-scale"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <span className="font-bold text-[14px]">{t('notif.title')}</span>
          {notifications.length > 0 && (
            <button onClick={() => update((s) => ({ dismissedNotifs: [...(s.dismissedNotifs || []), ...notifications.map((n) => n.id)] }))}
              className="press text-[12px] font-semibold text-muted hover:text-ink">
              {t('tx.clear')}
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted text-[13px]">{t('notif.none')}</div>
          ) : notifications.map((n) => {
            const tn = tones[n.tone] || tones.info;
            return (
              <div key={n.id} className="flex gap-3 px-4 py-3 border-b border-line/60 last:border-0">
                <div className={'w-9 h-9 rounded-xl grid place-items-center text-[15px] shrink-0 ' + tn.bg}>{n.icon}</div>
                <div className="text-[13px] leading-snug pt-1 text-ink">{n.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export function GlobalSearch({ open, onClose }) {
  const { state, t, lang, fmtMoney, fmtDateShort, setPage } = useApp();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 60); } }, [open]);
  const results = useMemo(() => {
    if (!q.trim()) return { tx: [], accounts: [], goals: [], debts: [] };
    const s = q.toLowerCase();
    const matchName = (n) =>
      (n?.ar || '').toLowerCase().includes(s) || (n?.en || '').toLowerCase().includes(s);
    return {
      tx: state.transactions.filter((x) =>
        String(x.amount).includes(s) ||
        (x.note?.ar || '').toLowerCase().includes(s) ||
        (x.note?.en || '').toLowerCase().includes(s) ||
        matchName(state.categories.find((c) => c.id === x.categoryId)) ||
        matchName(state.accounts.find((a) => a.id === x.accountId))
      ).slice(0, 8),
      accounts: state.accounts.filter((a) => matchName(a.name)).slice(0, 5),
      goals: state.goals.filter((g) => matchName(g.name)).slice(0, 5),
      debts: state.debts.filter((d) => matchName(d.person)).slice(0, 5),
    };
  }, [q, state]);
  const totalResults = results.tx.length + results.accounts.length + results.goals.length + results.debts.length;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] anim-fade" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden anim-scale">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Icon name="search" size={18} className="text-muted shrink-0" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('tx.search')}
            className="grow bg-transparent text-[15px] text-ink placeholder:text-muted outline-none" />
          <kbd className="hidden sm:block text-[10px] font-bold text-muted bg-surface2 px-2 py-1 rounded">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {!q.trim() ? (
            <div className="p-6 text-center text-muted text-[13px]">
              {lang === 'ar' ? 'دوّر على عملية، حساب، هدف، أو اسم' : 'Search transactions, accounts, goals, or people'}
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-muted text-[13px]">{t('tx.none')}</div>
          ) : (
            <div className="py-2">
              {results.accounts.length > 0 && (
                <SearchSection title={t('nav.accounts')}>
                  {results.accounts.map((a) => (
                    <SearchRow key={a.id} onClick={() => { setPage('accounts'); onClose(); }}
                      left={<div className="w-8 h-8 rounded-lg grid place-items-center text-[13px] font-bold text-white" style={{ background: a.color }}>{a.name[lang].charAt(0)}</div>}
                      title={a.name[lang]} sub={t('type.' + a.type)} />
                  ))}
                </SearchSection>
              )}
              {results.goals.length > 0 && (
                <SearchSection title={t('nav.goals')}>
                  {results.goals.map((g) => (
                    <SearchRow key={g.id} onClick={() => { setPage('goals'); onClose(); }}
                      left={<div className="w-8 h-8 rounded-lg grid place-items-center text-[15px]" style={{ background: g.color + '22' }}>{g.icon}</div>}
                      title={g.name[lang]} sub={fmtMoney(g.target)} />
                  ))}
                </SearchSection>
              )}
              {results.debts.length > 0 && (
                <SearchSection title={t('nav.debts')}>
                  {results.debts.map((d) => (
                    <SearchRow key={d.id} onClick={() => { setPage('debts'); onClose(); }}
                      left={<div className={'w-8 h-8 rounded-lg grid place-items-center text-[13px] font-bold ' + (d.kind === 'owe' ? 'bg-dangerSoft text-danger' : 'bg-accentSoft text-accent')}>
                        {d.person[lang].charAt(0)}
                      </div>}
                      title={d.person[lang]} sub={d.kind === 'owe' ? t('debt.iOwe') : t('debt.owedToMe')} right={fmtMoney(d.amount - (d.paid || 0))} />
                  ))}
                </SearchSection>
              )}
              {results.tx.length > 0 && (
                <SearchSection title={t('nav.transactions')}>
                  {results.tx.map((x) => {
                    const cat = state.categories.find((c) => c.id === x.categoryId);
                    const acc = state.accounts.find((a) => a.id === x.accountId);
                    return (
                      <SearchRow key={x.id} onClick={() => { setPage('transactions'); onClose(); }}
                        left={<div className="w-8 h-8 rounded-lg bg-surface2 grid place-items-center text-[14px]">{cat?.icon || '•'}</div>}
                        title={(x.note?.[lang] || cat?.[lang] || t('tx.' + x.type))}
                        sub={fmtDateShort(x.date) + (acc ? ' · ' + acc.name[lang] : '')}
                        right={<span className={x.type === 'income' ? 'text-accent' : x.type === 'expense' ? 'text-danger' : 'text-info'}>
                          {x.type === 'income' ? '+' : x.type === 'expense' ? '-' : ''}{fmtMoney(x.amount)}
                        </span>} />
                    );
                  })}
                </SearchSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function SearchSection({ title, children }) {
  return (
    <div className="mb-1">
      <div className="px-4 pt-2 pb-1 text-[10.5px] font-bold text-muted uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}
function SearchRow({ left, title, sub, right, onClick }) {
  return (
    <button onClick={onClick} className="press w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface2 transition text-start">
      <div className="shrink-0">{left}</div>
      <div className="min-w-0 grow">
        <div className="text-[13.5px] font-semibold truncate">{title}</div>
        {sub && <div className="text-[11.5px] text-muted truncate">{sub}</div>}
      </div>
      {right && <div className="text-[13px] font-bold num shrink-0">{right}</div>}
    </button>
  );
}