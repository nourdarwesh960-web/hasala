import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { S } from '../i18n';
import { CURRENCIES } from '../lib/constants';
import { loadState, saveState } from '../lib/storage';
import { blankState } from '../lib/demo';
import { computeTotals, generateInsights, generateNotifications, generateCategorizedInsights } from '../lib/finance';
import { fmtNum, shortDate, fullDate } from '../lib/utils';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    const loaded = loadState();
    const base = loaded || blankState();
    if (!base.settings) base.settings = {};
    if (!base.settings.theme || base.settings.theme === 'system') base.settings.theme = 'dark';
    return base;
  });
  const [page, setPage] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lang = state.settings.lang || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const th = state.settings.theme || 'dark';
      let dark;
      if (th === 'dark') dark = true;
      else if (th === 'light') dark = false;
      else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', dark);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#08080A' : '#F5F5F3');
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (state.settings.theme === 'system') apply(); };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [state.settings.theme]);
  const t = useCallback((key, vars) => {
    const entry = S[key];
    let str = entry ? (entry[lang] ?? entry.en) : key;
    if (vars) for (const k in vars) str = str.replace('{' + k + '}', vars[k]);
    return str;
  }, [lang]);
  const cur = CURRENCIES[state.settings.currency] || CURRENCIES.EGP;
  const fmtMoney = useCallback((n, opts = {}) => {
    const v = Number(n) || 0;
    const abs = Math.abs(v);
    const decimals = opts.decimals ?? (abs % 1 === 0 ? 0 : 2);
    const num = fmtNum(abs, decimals);
    const symbol = cur[lang] || 'EGP';
    return (v < 0 ? '-' : '') + num + ' ' + symbol;
  }, [cur, lang]);
  const fmtDateShort = useCallback((iso) => shortDate(iso, lang), [lang]);
  const fmtDateFull = useCallback((iso) => fullDate(iso, lang), [lang]);
  const totals = useMemo(() => computeTotals(state), [state]);
  const notifications = useMemo(() => generateNotifications(state, lang, fmtMoney, t), [state, lang, fmtMoney, t]);
  const insights = useMemo(() => generateInsights(state, lang, fmtMoney, t), [state, lang, fmtMoney, t]);
  const categorizedInsights = useMemo(() => generateCategorizedInsights(state, lang, fmtMoney, t), [state, lang, fmtMoney, t]);
  const showToast = useCallback((msg, tone = 'neutral', opts = {}) => {
    setToast({ msg, tone, action: opts.action || null });
    const dur = opts.duration || 2400;
    setTimeout(() => setToast(null), dur);
  }, []);
  const update = useCallback((patch) => {
    setState((s) => (typeof patch === 'function' ? { ...s, ...patch(s) } : { ...s, ...patch }));
  }, []);
  const catById = useCallback((id) => state.categories.find((c) => c.id === id) || null, [state.categories]);
  const accById = useCallback((id) => state.accounts.find((a) => a.id === id) || null, [state.accounts]);
  const value = {
    state, update, setState, t, lang, dir,
    fmtMoney, fmtDateShort, fmtDateFull,
    totals, notifications, insights, categorizedInsights,
    showToast, catById, accById,
    modal, setModal, page, setPage,
    notifOpen, setNotifOpen, searchOpen, setSearchOpen,
    fabOpen, setFabOpen,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}