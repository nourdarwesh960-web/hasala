import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Btn, EmptyState, IconBtn } from '../components/ui';
import { Icon } from '../components/Icon';
import { goalSaved } from '../lib/finance';
import { todayISO, daysBetween } from '../lib/utils';
export function GoalsPage() {
const { state, update, t, lang, fmtMoney, setModal, showToast } = useApp();
const goals = useMemo(() => state.goals.map((g) => {
const saved = goalSaved(g, state.transactions);
const pct = g.target > 0 ? (saved / g.target) * 100 : 0;
const remaining = Math.max(0, g.target - saved);
let monthsLeft = null, perMonth = null;
if (g.deadline) {
const days = daysBetween(todayISO(), g.deadline);
monthsLeft = Math.max(1, Math.ceil(days / 30.44));
perMonth = remaining > 0 ? remaining / monthsLeft : 0;
}
return { ...g, saved, pct, remaining, perMonth, monthsLeft };
}), [state.goals, state.transactions]);
const near = goals.filter((g) => g.pct >= 60 || (g.monthsLeft !== null && g.monthsLeft <= 3));
const far = goals.filter((g) => !near.includes(g));
const del = (g) => {
setModal({
type: 'confirm',
payload: {
title: t('common.delete'),
message: lang === 'ar' ? 'هتحذف الهدف ده؟' : 'Delete this goal?',
onConfirm: () => {
update((s) => ({
goals: s.goals.filter((x) => x.id !== g.id),
transactions: s.transactions.filter((x) => x.goalId !== g.id),
}));
showToast(lang === 'ar' ? 'اتحذف' : 'Deleted');
},
},
});
};
const renderGoal = (g) => (
<Card key={g.id} className="p-5 group">
<div className="flex items-start gap-3 mb-4">
<div className="w-12 h-12 rounded-2xl grid place-items-center text-[22px] shrink-0"
style={{ background: g.color + '1A' }}>{g.icon}</div>
<div className="min-w-0 grow">
<div className="text-[15px] font-bold truncate">{g.name[lang]}</div>
<div className="text-[11.5px] text-muted">{g.deadline || t('goal.noDeadline')}</div>
</div>
<div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
<IconBtn name="edit" size={15} onClick={() => setModal({ type: 'editGoal', payload: g })} />
<IconBtn name="trash" size={15} onClick={() => del(g)} />
</div>
</div>
<div className="flex items-baseline justify-between mb-2">
<span className="text-[20px] font-extrabold num">{fmtMoney(g.saved)}</span>
<span className="text-[13px] text-muted num">/ {fmtMoney(g.target)}</span>
</div>
<div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 7 }}>
<div className="h-full rounded-full" style={{ width: Math.min(100, g.pct) + '%', background: g.color }} />
</div>
<div className="flex items-center justify-between mt-2.5">
<span className="text-[12px] font-bold num" style={{ color: g.color }}>{Math.round(g.pct)}%</span>
<span className="text-[11.5px] text-muted num">{t('goal.remaining')}: {fmtMoney(g.remaining)}</span>
</div>
{g.perMonth > 0 && (
<div className="mt-3.5 pt-3.5 border-t border-line flex items-center justify-between">
<span className="text-[11.5px] text-muted">{t('goal.perMonth')}</span>
<span className="text-[12.5px] font-bold num">{fmtMoney(g.perMonth, { decimals: 0 })}</span>
</div>
)}
<Btn size="sm" variant="secondary" className="w-full mt-4"
onClick={() => setModal({ type: 'contribute', payload: { goal: g } })}>
+ {t('goal.contribute')}
</Btn>
</Card>
);
return (
<div className="space-y-5 anim-rise">
<div className="flex items-center gap-3">
<h1 className="text-[22px] font-extrabold">{t('goal.title')}</h1>
<div className="grow" />
<Btn size="sm" onClick={() => setModal({ type: 'addGoal' })}>
<Icon name="plus" size={15} sw={2.4} /> {t('goal.add')}
</Btn>
</div>
{state.goals.length === 0 ? (
<EmptyState icon="" title={t('goal.none')}
action={() => setModal({ type: 'addGoal' })} actionLabel={t('goal.addFirst')} />
) : (
<>
{near.length > 0 && (
<div>
<h2 className="text-[12px] font-bold text-muted mb-2.5 px-1 tracking-wider">{t('goal.near')}</h2>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{near.map(renderGoal)}</div>
</div>
)}
{far.length > 0 && (
<div>
<h2 className="text-[12px] font-bold text-muted mb-2.5 px-1 tracking-wider">{t('goal.far')}</h2>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{far.map(renderGoal)}</div>
</div>
)}
</>
)}
</div>
);
}