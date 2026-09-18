import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NAV_ITEMS, MOBILE_NAV, MORE_ITEMS } from '../lib/constants';
import { Icon } from './Icon';
import { IconBtn } from './ui';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from './Avatar';
import { fmtNum, todayISO } from '../lib/utils';
export function Sidebar() {
const { page, setPage, t, state, totals, fmtMoney } = useApp();
const name = state.profile.name;
const photo = state.profile.photo;
return (
<aside className="hidden lg:flex flex-col fixed inset-y-0 start-0 w-[260px] bg-surface border-e border-line z-30">
<div className="px-5 pt-6 pb-5">
<div className="flex items-center gap-2.5">
<div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-white dark:text-[#04150E]">
<Icon name="wallet" size={19} sw={1.9} />
</div>
<div className="min-w-0">
<div className="text-[16px] font-extrabold leading-none truncate">{t('app.name')}</div>
<div className="text-[10.5px] text-muted mt-1 truncate">{t('app.tagline')}</div>
</div>
</div>
</div>
<nav className="px-3 space-y-0.5 overflow-y-auto no-sb grow">
{NAV_ITEMS.map((item) => {
const active = page === item.id;
return (
<button key={item.id} onClick={() => setPage(item.id)}
className={'press w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[14px] font-semibold transition ' +
(active ? 'bg-accentSoft text-accent' : 'text-muted hover:text-ink hover:bg-surface2')}>
<Icon name={item.icon} size={18} sw={active ? 2.1 : 1.75} />
<span>{t(item.label)}</span>
</button>
);
})}
</nav>
<div className="p-3">
<div className="rounded-2xl bg-surface2 p-3.5">
<div className="text-[10.5px] text-muted font-semibold mb-1">{t('dash.networth')}</div>
<div className="text-[17px] font-extrabold num">{fmtMoney(totals.netWorth)}</div>
<div className="flex items-center gap-3 mt-2.5 text-[10.5px]">
<span className="flex items-center gap-1 text-accent font-semibold">
<Icon name="arrowUp" size={11} sw={2.4} />{fmtNum(totals.assets)}
</span>
<span className="flex items-center gap-1 text-danger font-semibold">
<Icon name="arrowDown" size={11} sw={2.4} />{fmtNum(totals.liabilities)}
</span>
</div>
</div>
{(name || photo) && (
<button onClick={() => setPage('settings')}
className="press flex items-center gap-2.5 px-1 pt-3 w-full text-start hover:opacity-80 transition">
<Avatar photo={photo} name={name} size={32} rounded="rounded-full" />
<div className="text-[13px] font-semibold truncate">{name || '—'}</div>
</button>
)}
</div>
</aside>
);
}
export function TopBar({ onOpenCommand, onLogout }) {
const { t, state, setNotifOpen, setSearchOpen, lang, update, fmtDateFull, setPage } = useApp();
const [now, setNow] = useState(new Date());
useEffect(() => {
const i = setInterval(() => setNow(new Date()), 60000);
return () => clearInterval(i);
}, []);
const hour = now.getHours();
const greetKey = hour < 12 ? 'greet.morning' : hour < 18 ? 'greet.afternoon' : 'greet.evening';
const name = state.profile.name;
const photo = state.profile.photo;
return (
<header className="lg:ps-[260px] sticky top-0 z-20 bg-bg/85 backdrop-blur-lg border-b border-line/60">
<div className="max-w-[1180px] mx-auto ps-16 pe-4 sm:ps-20 sm:pe-6 lg:px-8 h-16 flex items-center gap-3">
{/* يسار: تحية مختصرة على الموبايل */}
<div className="lg:hidden min-w-0">
<div className="text-[13px] font-bold leading-tight truncate">
{t(greetKey)}{name ? ', ' + name : ''}
</div>
</div>
{/* يسار: التحية الكاملة على الديسكتوب */}
<div className="hidden lg:block min-w-0">
<div className="text-[15px] font-bold leading-tight truncate">
{t(greetKey)}{name ? ', ' + name : ''}
</div>
<div className="text-[11px] text-muted truncate">{fmtDateFull(todayISO())}</div>
</div>
<div className="flex-1 min-w-16" />
{/* البحث */}
<button onClick={onOpenCommand}
className="press hidden md:flex items-center gap-2 h-10 ps-3 pe-3 rounded-xl bg-surface2 border border-line text-muted hover:text-ink transition w-[180px] lg:w-[240px] justify-between shrink-0">
<span className="flex items-center gap-2 min-w-0">
<Icon name="search" size={16} />
<span className="text-[12.5px] truncate">{t('cmd.placeholder')}</span>
</span>
<kbd className="text-[10px] font-bold bg-surface px-1.5 py-0.5 rounded border border-line shrink-0">⌘K</kbd>
</button>
{/* البحث مصغر على الشاشات الصغيرة */}
<IconBtn className="md:hidden" name="search" onClick={() => setSearchOpen(true)} />
<ThemeToggle />
<button onClick={() => update({ settings: { ...state.settings, lang: lang === 'ar' ? 'en' : 'ar' } })}
className="press h-10 px-3 rounded-xl bg-surface2 border border-line text-[12.5px] font-bold text-muted hover:text-ink transition shrink-0">
{lang === 'ar' ? 'EN' : 'ع'}
</button>
<div className="relative shrink-0">
<IconBtn name="bell" onClick={() => setNotifOpen(true)} />
</div>
</div>
</header>
);
}
export function MobileNav() {
const { page, setPage, t, setFabOpen } = useApp();
const morePages = MORE_ITEMS.map((i) => i.id);
const isMoreActive = morePages.includes(page);
return (
<nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-line pb-[env(safe-area-inset-bottom)]">
<div className="flex items-stretch h-[62px]">
{MOBILE_NAV.map((item) => {
if (item.id === 'fab') {
return (
<div key="fab-slot" className="flex-1 relative">
<button onClick={() => setFabOpen(true)}
className="press absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-2xl bg-accent text-white dark:text-[#04150E] grid place-items-center shadow-lg shadow-accent/25">
<Icon name="plus" size={24} sw={2.4} />
</button>
<div className="absolute bottom-1.5 inset-x-0 text-center text-[10px] font-semibold text-muted pointer-events-none">
{t('tx.add')}
</div>
</div>
);
}
const active = item.id === 'more' ? isMoreActive : page === item.id;
return (
<button key={item.id} onClick={() => setPage(item.id)}
className={'press flex-1 flex flex-col items-center justify-center gap-1 transition ' +
(active ? 'text-accent' : 'text-muted')}>
<Icon name={item.icon} size={21} sw={active ? 2.2 : 1.75} />
<span className="text-[10px] font-semibold">{t(item.label)}</span>
</button>
);
})}
</div>
</nav>
);
}
export function MoreSheet() {
const { page, setPage, t } = useApp();
if (page !== 'more') return null;
return (
<div className="lg:hidden fixed inset-0 z-[90]" onClick={() => setPage('dashboard')}>
<div className="absolute inset-0 bg-black/40 anim-fade" />
<div className="absolute bottom-0 inset-x-0 bg-surface rounded-t-3xl border-t border-line p-4 pb-8 anim-sheet"
onClick={(e) => e.stopPropagation()}>
<div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
<div className="grid grid-cols-3 gap-3">
{MORE_ITEMS.map((i) => (
<button key={i.id} onClick={() => setPage(i.id)}
className="press flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-surface2 text-ink">
<Icon name={i.icon} size={22} />
<span className="text-[11.5px] font-semibold">{t(i.label)}</span>
</button>
))}
</div>
</div>
</div>
);
}