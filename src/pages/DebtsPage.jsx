import { useApp } from '../context/AppContext';
import { Card, Btn, EmptyState, IconBtn } from '../components/ui';
import { todayISO, daysBetween } from '../lib/utils';
export function DebtsPage() {
const { state, update, t, lang, fmtMoney, fmtDateShort, setModal, showToast, totals } = useApp();
const owe = state.debts.filter((d) => d.kind === 'owe');
const owed = state.debts.filter((d) => d.kind === 'owed');
const del = (d) => {
setModal({ type: 'confirm', payload: {
title: t('common.delete'), message: lang === 'ar' ? 'هتحذف الدين ده؟' : 'Delete this debt?',
onConfirm: () => { update((s) => ({ debts: s.debts.filter((x) => x.id !== d.id) })); showToast(lang === 'ar' ? 'اتحذف' : 'Deleted'); },
}});
};
const DebtCard = ({ d }) => {
const remaining = Math.max(0, d.amount - (d.paid || 0));
const pct = d.amount > 0 ? (d.paid / d.amount) * 100 : 0;
const settled = remaining <= 0;
const isOwe = d.kind === 'owe';
const overdue = d.dueDate && !settled && daysBetween(todayISO(), d.dueDate) < 0;
return (
<Card className="p-4 group">
<div className="flex items-center gap-3 mb-3">
<div className={'w-10 h-10 rounded-xl grid place-items-center text-[14px] font-bold shrink-0 ' + (isOwe ? 'bg-dangerSoft text-danger' : 'bg-accentSoft text-accent')}>{d.person[lang].charAt(0)}</div>
<div className="grow min-w-0">
<div className="text-[14px] font-bold truncate">{d.person[lang]}</div>
<div className="text-[11.5px] text-muted">
{d.dueDate ? fmtDateShort(d.dueDate) : fmtDateShort(d.date)}
{overdue && <span className="text-danger font-semibold"> · {t('rem.overdue')}</span>}
{settled && <span className="text-accent font-semibold"> · {t('debt.settled')}</span>}
</div>
</div>
<div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
<IconBtn name="edit" size={14} onClick={() => setModal({ type: 'editDebt', payload: d })} />
<IconBtn name="trash" size={14} onClick={() => del(d)} />
</div>
</div>
<div className="flex items-baseline justify-between mb-2">
<span className={'text-[18px] font-extrabold num ' + (isOwe ? 'text-danger' : 'text-accent')}>{fmtMoney(remaining)}</span>
<span className="text-[11px] text-muted num">{t('common.of')} {fmtMoney(d.amount)}</span>
</div>
{d.paid > 0 && (
<div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 5 }}>
<div className="h-full rounded-full" style={{ width: Math.min(100, pct) + '%', background: isOwe ? 'var(--danger)' : 'var(--accent)' }} />
</div>
)}
{!settled && (
<button onClick={() => setModal({ type: 'payDebt', payload: { debt: d } })}
className="press mt-3.5 w-full h-9 rounded-xl bg-surface2 text-[12.5px] font-bold text-muted hover:text-ink transition">
{t('debt.payPartial')}
</button>
)}
</Card>
);
};
return (
<div className="space-y-6 anim-rise">
<div className="flex items-center gap-3">
<h1 className="text-[22px] font-extrabold">{t('debt.title')}</h1>
<div className="grow" />
<Btn size="sm" onClick={() => setModal({ type: 'addDebt', payload: { kind: 'owe' } })}>
<span className="text-[15px] font-bold">+</span> {t('debt.add')}
</Btn>
</div>
<div className="grid grid-cols-3 gap-3">
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('debt.totalOwe')}</div>
<div className="text-[17px] font-extrabold num text-danger">{fmtMoney(totals.debtOwe)}</div>
</Card>
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('debt.totalOwed')}</div>
<div className="text-[17px] font-extrabold num text-accent">{fmtMoney(totals.debtOwed)}</div>
</Card>
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('debt.net')}</div>
<div className={'text-[17px] font-extrabold num ' + (totals.debtOwed - totals.debtOwe >= 0 ? 'text-accent' : 'text-danger')}>
{totals.debtOwed - totals.debtOwe >= 0 ? '+' : '−'}{fmtMoney(Math.abs(totals.debtOwed - totals.debtOwe))}
</div>
</Card>
</div>
{state.debts.length === 0 ? (
<EmptyState icon="" title={t('debt.none')} />
) : (
<>
{owe.length > 0 && (
<div>
<h2 className="text-[12px] font-bold text-muted mb-2.5 px-1 tracking-wider">{t('debt.iOwe')}</h2>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{owe.map((d) => <DebtCard key={d.id} d={d} />)}</div>
</div>
)}
{owed.length > 0 && (
<div>
<h2 className="text-[12px] font-bold text-muted mb-2.5 px-1 tracking-wider">{t('debt.owedToMe')}</h2>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{owed.map((d) => <DebtCard key={d.id} d={d} />)}</div>
</div>
)}
</>
)}
</div>
);
}