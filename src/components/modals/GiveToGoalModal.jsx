import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid, todayISO } from '../../lib/utils';
import { goalSaved } from '../../lib/finance';
import { Modal, Btn, Field, Input, Select, Progress } from '../ui';
export function GiveToGoalModal({ open, onClose, payload }) {
const { state, update, t, lang, fmtMoney, showToast, setModal } = useApp();
const goals = state.goals;
const surplus = payload?.surplus || 0;
const [goalId, setGoalId] = useState(goals[0]?.id || '');
const [amount, setAmount] = useState(surplus > 0 ? String(Math.round(surplus)) : '');
const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
const [date, setDate] = useState(todayISO());
const numAmount = parseFloat(amount) || 0;
const canSave = numAmount > 0 && goalId && accountId;
const save = () => {
if (!canSave) return;
const tx = {
id: uid('tx'), type: 'goal', amount: numAmount,
accountId, goalId, date,
note: { ar: 'توفير', en: 'Saving' },
};
update((s) => ({ transactions: [tx, ...s.transactions] }));
showToast(t('surplus.moved') + ' ', 'good');
onClose();
};
const openAddGoal = () => {
onClose();
setTimeout(() => setModal({ type: 'addGoal' }), 120);
};
return (
<Modal open={open} onClose={onClose} title={t('surplus.giveToGoal')}>
{goals.length === 0 ? (
<div className="text-center py-8">
<div className="text-[15px] text-muted mb-5">{t('surplus.noGoals')}</div>
<Btn onClick={openAddGoal}>+ {t('goal.add')}</Btn>
</div>
) : (
<>
{surplus > 0 && (
<div className="p-3.5 rounded-2xl bg-accentSoft mb-4 flex items-center justify-between">
<div>
<div className="text-[11px] font-semibold text-accent">{t('surplus.title')}</div>
<div className="text-[11px] text-accent/70 mt-0.5">{t('surplus.tip')}</div>
</div>
<div className="text-[18px] font-extrabold num text-accent">{fmtMoney(surplus)}</div>
</div>
)}
<div className="mb-4">
<div className="text-[12px] font-semibold text-muted mb-2">{t('surplus.pickGoal')}</div>
<div className="space-y-2 max-h-[220px] overflow-y-auto pe-1">
{goals.map((g) => {
const gs = goalSaved(g, state.transactions);
const pct = g.target > 0 ? (gs / g.target) * 100 : 0;
const active = goalId === g.id;
return (
<button key={g.id} onClick={() => setGoalId(g.id)}
className={'press w-full flex items-center gap-3 p-3 rounded-2xl border text-start transition ' +
(active ? 'border-accent bg-accentSoft' : 'border-line bg-surface2 hover:border-accent/40')}>
<div className="w-10 h-10 rounded-xl grid place-items-center text-[18px] shrink-0"
style={{ background: g.color + '1A' }}>{g.icon}</div>
<div className="min-w-0 grow">
<div className="text-[13.5px] font-bold truncate">{g.name[lang]}</div>
<div className="text-[11px] text-muted num">{fmtMoney(gs)} / {fmtMoney(g.target)}</div>
<Progress className="mt-1.5" value={pct} height={4} color={g.color} />
</div>
</button>
);
})}
</div>
</div>
<Field label={t('surplus.amount')} className="mb-3">
<div className="field rounded-2xl px-4 h-14 flex items-center">
<input autoFocus inputMode="decimal" value={amount}
onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
placeholder="0"
className="grow bg-transparent text-[22px] font-extrabold num text-ink placeholder:text-muted/40 w-full" />
</div>
</Field>
{surplus > 0 && (
<div className="flex gap-2 mb-4">
{[25, 50, 100].map((p) => (
<button key={p} onClick={() => setAmount(String(Math.round(surplus * p / 100)))}
className="press flex-1 h-9 rounded-xl bg-surface2 text-[12px] font-bold text-muted hover:text-ink">
{p}%
</button>
))}
</div>
)}
<Field label={t('goal.fromAcc')} className="mb-4">
<Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
{state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}
</Select>
</Field>
<div className="flex gap-2 mt-6">
<Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
<Btn onClick={save} disabled={!canSave} className="flex-1">{t('surplus.confirm')}</Btn>
</div>
</>
)}
</Modal>
);
}