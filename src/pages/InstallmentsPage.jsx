import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Btn, EmptyState, IconBtn } from '../components/ui';
import { installmentStats } from '../lib/finance';
import { fmtDateShort } from '../lib/utils';
export function InstallmentsPage() {
const { state, update, t, lang, fmtMoney, setModal, showToast } = useApp();
const stats = useMemo(() => state.installments.map((i) => ({ ...i, ...installmentStats(i) })), [state.installments]);
const totalRemaining = stats.reduce((s, i) => s + i.remainingAmount, 0);
const totalMonthly = stats.reduce((s, i) => s + (i.remainingCount > 0 ? i.monthly : 0), 0);
const activeCount = stats.filter((i) => i.remainingCount > 0).length;
const del = (inst) => {
setModal({ type: 'confirm', payload: {
title: t('common.delete'), message: lang === 'ar' ? 'هتحذف القسط ده؟' : 'Delete this installment?',
onConfirm: () => {
update((s) => ({ installments: s.installments.filter((x) => x.id !== inst.id), transactions: s.transactions.filter((x) => x.installmentId !== inst.id) }));
showToast(lang === 'ar' ? 'اتحذف' : 'Deleted');
},
}});
};
return (
<div className="space-y-5 anim-rise">
<div className="flex items-center gap-3">
<h1 className="text-[22px] font-extrabold">{t('inst.title')}</h1>
<div className="grow" />
<Btn size="sm" onClick={() => setModal({ type: 'addInstallment' })}>
<span className="text-[15px] font-bold">+</span> {t('inst.add')}
</Btn>
</div>
{state.installments.length === 0 ? (
<EmptyState icon="" title={t('inst.none')} action={() => setModal({ type: 'addInstallment' })} actionLabel={t('inst.addFirst')} />
) : (
<>
<div className="grid grid-cols-3 gap-3">
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('inst.totalRemaining')}</div>
<div className="text-[17px] font-extrabold num text-danger">{fmtMoney(totalRemaining)}</div>
</Card>
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('inst.monthlyLoad')}</div>
<div className="text-[17px] font-extrabold num">{fmtMoney(totalMonthly)}</div>
</Card>
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('inst.active')}</div>
<div className="text-[17px] font-extrabold num">{activeCount}</div>
</Card>
</div>
<div className="space-y-4">
{stats.map((i) => {
const done = i.remainingCount === 0;
return (
<Card key={i.id} className="p-5 group relative overflow-hidden">
{done && (
<div className="absolute top-3 end-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accentSoft text-accent">{t('inst.done')}</div>
)}
<div className="flex items-start gap-3 mb-4">
<div className="w-12 h-12 rounded-2xl grid place-items-center text-[22px] shrink-0" style={{ background: i.color + '1A' }}>{i.icon}</div>
<div className="min-w-0 grow">
<div className="text-[15px] font-bold truncate">{i.name[lang]}</div>
<div className="text-[11.5px] text-muted">
{i.paidCount} / {i.count}
{!done && <> · {t('inst.next')} {fmtDateShort(i.nextDate)}</>}
</div>
</div>
<div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
<IconBtn name="edit" size={15} onClick={() => setModal({ type: 'editInstallment', payload: i })} />
<IconBtn name="trash" size={15} onClick={() => del(i)} />
</div>
</div>
<div className="grid grid-cols-3 gap-3 mb-3">
<div>
<div className="text-[10.5px] font-semibold text-muted">{t('inst.monthly')}</div>
<div className="text-[13.5px] font-bold num">{fmtMoney(i.monthly)}</div>
</div>
<div>
<div className="text-[10.5px] font-semibold text-muted">{t('inst.paid')}</div>
<div className="text-[13.5px] font-bold num text-accent">{fmtMoney(i.paidAmount)}</div>
</div>
<div>
<div className="text-[10.5px] font-semibold text-muted">{t('inst.remaining')}</div>
<div className="text-[13.5px] font-bold num text-danger">{fmtMoney(i.remainingAmount)}</div>
</div>
</div>
<div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 7 }}>
<div className="h-full rounded-full" style={{ width: Math.min(100, i.progress) + '%', background: done ? 'var(--accent)' : i.color }} />
</div>
{!done && (
<Btn size="sm" className="w-full mt-4" onClick={() => setModal({ type: 'payInstallment', payload: { inst: i } })}>
{t('inst.payOne')}
</Btn>
)}
</Card>
);
})}
</div>
</>
)}
</div>
);
}