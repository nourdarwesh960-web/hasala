import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
export function CommandCenter({ open, onClose }) {
  const { state, t, lang, fmtMoney, fmtDateShort, setModal, setPage } = useApp();
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // deferred value → ما يهنجش وقت الكتابة
  const deferredQ = useDeferredValue(q);
  useEffect(() => {
    if (open) {
      setQ('');
      setActiveIdx(0);
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);
  // الإجراءات الأساسية (ثابتة)
  const actions = useMemo(() => [
    { id: 'a1', icon: 'plus', label: t('cmd.addExpense'), run: () => { setModal({ type: 'addTx', payload: { type: 'expense' } }); onClose(); } },
    { id: 'a2', icon: 'arrowDown', label: t('cmd.addIncome'), run: () => { setModal({ type: 'addTx', payload: { type: 'income' } }); onClose(); } },
    { id: 'a3', icon: 'arrowRight', label: t('cmd.addTransfer'), run: () => { setModal({ type: 'addTx', payload: { type: 'transfer' } }); onClose(); } },
    { id: 'a4', icon: 'sparkles', label: t('cmd.smartAdd'), run: () => { setModal({ type: 'smartAdd' }); onClose(); } },
    { id: 'a5', icon: 'target', label: t('cmd.addToGoal'), run: () => { setPage('goals'); onClose(); } },
  ], [t, setModal, setPage, onClose]);
  const navItems = useMemo(() => [
    { id: 'n1', icon: 'home', label: t('cmd.goDashboard'), page: 'dashboard' },
    { id: 'n2', icon: 'list', label: t('cmd.goTransactions'), page: 'transactions' },
    { id: 'n3', icon: 'sparkles', label: t('cmd.goInsights'), page: 'insights' },
    { id: 'n4', icon: 'chart', label: t('cmd.goAnalytics'), page: 'analytics' },
    { id: 'n5', icon: 'target', label: t('cmd.goGoals'), page: 'goals' },
    { id: 'n6', icon: 'wallet', label: t('cmd.goAccounts'), page: 'accounts' },
    { id: 'n7', icon: 'calendar', label: t('cmd.goCalendar'), page: 'calendar' },
    { id: 'n8', icon: 'settings', label: t('cmd.goSettings'), page: 'settings' },
  ].map((n) => ({ ...n, run: () => { setPage(n.page); onClose(); } })), [t, setPage, onClose]);
  const recent = useMemo(() => state.transactions.slice(0, 5).map((tx) => {
    const cat = state.categories.find((c) => c.id === tx.categoryId);
    const acc = state.accounts.find((a) => a.id === tx.accountId);
    return {
      id: 'r_' + tx.id,
      icon: cat?.icon || 'dot',
      label: tx.note?.[lang] || cat?.[lang] || t('tx.' + tx.type),
      sub: fmtDateShort(tx.date) + (acc ? ' · ' + acc.name[lang] : '') + ' · ' + fmtMoney(tx.amount),
      run: () => {
        setModal({ type: 'addTx', payload: { type: tx.type, presetAmount: tx.amount, presetCategory: tx.categoryId, presetAccount: tx.accountId } });
        onClose();
      },
    };
  }), [state.transactions, state.categories, state.accounts, lang, t, fmtMoney, fmtDateShort, setModal, onClose]);
  // فلترة سريعة جدًا
  const results = useMemo(() => {
    const query = (deferredQ || '').trim().toLowerCase();
    if (!query) {
      return { actions, nav: navItems, recent, search: [] };
    }
    const matchedActions = actions.filter((a) => a.label.toLowerCase().includes(query));
    const matchedNav = navItems.filter((n) => n.label.toLowerCase().includes(query));
    const search = [];
    // حسابات
    for (const a of state.accounts) {
      if ((a.name.ar || '').toLowerCase().includes(query) || (a.name.en || '').toLowerCase().includes(query)) {
        search.push({
          id: 'acc_' + a.id,
          icon: 'wallet',
          label: a.name[lang],
          sub: t('nav.accounts'),
          run: () => { setPage('accounts'); onClose(); },
        });
      }
      if (search.length >= 4) break;
    }
    // تصنيفات
    if (search.length < 6) {
      for (const c of state.categories) {
        if ((c.ar || '').toLowerCase().includes(query) || (c.en || '').toLowerCase().includes(query)) {
          search.push({
            id: 'cat_' + c.id,
            icon: c.icon || 'dot',
            label: c[lang],
            sub: t('tx.category'),
            run: () => { setPage('transactions'); onClose(); },
          });
        }
        if (search.length >= 6) break;
      }
    }
    // عمليات
    if (search.length < 10) {
      for (const tx of state.transactions) {
        const cat = state.categories.find((c) => c.id === tx.categoryId);
        const acc = state.accounts.find((a) => a.id === tx.accountId);
        const hay = [
          String(tx.amount),
          tx.note?.[lang] || '',
          cat?.[lang] || '',
          acc?.name?.[lang] || '',
        ].join(' ').toLowerCase();
        if (hay.includes(query)) {
          search.push({
            id: 'tx_' + tx.id,
            icon: cat?.icon || 'dot',
            label: tx.note?.[lang] || cat?.[lang] || t('tx.' + tx.type),
            sub: fmtDateShort(tx.date) + ' · ' + fmtMoney(tx.amount),
            run: () => { setPage('transactions'); onClose(); },
          });
        }
        if (search.length >= 10) break;
      }
    }
    return { actions: matchedActions, nav: matchedNav, recent: [], search };
  }, [deferredQ, actions, navItems, recent, state, lang, t, fmtMoney, fmtDateShort, setPage, onClose]);
  // قائمة مسطحة للتنقل بالكيبورد
  const flat = useMemo(() => [
    ...results.actions, ...results.nav, ...results.recent, ...results.search,
  ], [results]);
  // arrow keys + enter + escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flat[activeIdx]?.run?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, flat, activeIdx, onClose]);
  // scroll active into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-idx="' + activeIdx + '"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);
  if (!open) return null;
  const groups = [
    { key: 'actions', label: t('cmd.actions') },
    { key: 'nav', label: null },
    { key: 'recent', label: t('cmd.recent') },
    { key: 'search', label: deferredQ ? t('cmd.noResults') : null },
  ];
  let flatIdx = 0;
  const hasResults = flat.length > 0;
  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[8vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md anim-fade" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden anim-scale flex flex-col max-h-[80vh]">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-line shrink-0">
          <Icon name="search" size={20} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }}
            placeholder={t('cmd.placeholder')}
            className="grow bg-transparent text-[15px] text-ink placeholder:text-muted/70 outline-none"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="text-[10px] font-bold text-muted bg-surface2 px-2 py-1 rounded border border-line">ESC</kbd>
        </div>
        {/* Results */}
        <div ref={listRef} className="overflow-y-auto grow">
          {!hasResults ? (
            <div className="p-10 text-center text-muted text-[13px]">
              <Icon name="search" size={32} className="mx-auto mb-3 opacity-30" />
              {t('cmd.noResults')}
            </div>
          ) : (
            groups.map((g) => {
              const list = results[g.key];
              if (!list || list.length === 0) return null;
              return (
                <div key={g.key} className="py-1">
                  {g.label && (
                    <div className="px-5 pt-3 pb-1.5 text-[10.5px] font-bold text-muted uppercase tracking-wider">
                      {g.label}
                    </div>
                  )}
                  {list.map((item) => {
                    const myIdx = flatIdx++;
                    const active = myIdx === activeIdx;
                    return (
                      <button
                        key={item.id}
                        data-idx={myIdx}
                        onClick={item.run}
                        onMouseEnter={() => setActiveIdx(myIdx)}
                        className={'press w-full flex items-center gap-3 px-5 py-2.5 text-start transition ' +
                          (active ? 'bg-accentSoft' : 'hover:bg-surface2')}
                      >
                        <div className={'w-9 h-9 rounded-xl grid place-items-center text-[15px] shrink-0 ' +
                          (active ? 'bg-accent text-white dark:text-[#04150E]' : 'bg-surface2 text-muted')}>
                          {typeof item.icon === 'string' && item.icon.length <= 2
                            ? item.icon
                            : <Icon name={item.icon} size={17} />}
                        </div>
                        <div className="min-w-0 grow">
                          <div className={'text-[13.5px] font-semibold truncate ' + (active ? 'text-accent' : 'text-ink')}>
                            {item.label}
                          </div>
                          {item.sub && <div className="text-[11.5px] text-muted truncate">{item.sub}</div>}
                        </div>
                        {active && <Icon name="arrowRight" size={15} className="text-accent shrink-0 flip" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-line text-[11px] text-muted shrink-0 bg-surface2/50">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded text-[10px] font-bold">↑↓</kbd>
            {t('cmd.hint')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded text-[10px] font-bold">↵</kbd>
            {t('cmd.select')}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded text-[10px] font-bold">ESC</kbd>
            {t('cmd.close')}
          </span>
        </div>
      </div>
    </div>
  );
}