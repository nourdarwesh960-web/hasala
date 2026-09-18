import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ACCOUNT_COLORS } from '../../lib/constants';
import { uid, todayISO, daysBetween } from '../../lib/utils';
import { goalSaved, checkGoalMilestone } from '../../lib/finance';
import { Modal, Btn, Field, Input, Select, Progress } from '../ui';
import { Icon } from '../Icon';
const GOAL_ICONS = [
  'target', 'laptop', 'house', 'car', 'plane', 'book',
  'briefcase', 'gift', 'coins', 'clock', 'heart', 'tag',
];
export function GoalModal({ open, onClose, edit }) {
  const { update, t, lang, showToast } = useApp();
  const [name, setName] = useState(edit?.name?.[lang] || '');
  const [target, setTarget] = useState(edit ? String(edit.target) : '');
  const [saved, setSaved] = useState(edit ? String(edit.initialSaved || 0) : '0');
  const [deadline, setDeadline] = useState(edit?.deadline || '');
  const [icon, setIcon] = useState(edit?.icon || 'target');
  const [color, setColor] = useState(edit?.color || ACCOUNT_COLORS[0]);
  const save = () => {
    if (!name.trim() || !target) return;
    const obj = {
      name: { ar: name, en: name },
      target: parseFloat(target) || 0,
      initialSaved: parseFloat(saved) || 0,
      deadline: deadline || null,
      type: deadline && daysBetween(todayISO(), deadline) <= 90 ? 'short' : 'long',
      icon, color,
    };
    if (edit) update((s) => ({ goals: s.goals.map((g) => g.id === edit.id ? { ...g, ...obj } : g) }));
    else update((s) => ({ goals: [...s.goals, { id: uid('goal'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('goal.add')}>
      <div className="space-y-4">
        <Field label={t('goal.name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('goal.namePh')} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('goal.target')}>
            <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
          <Field label={t('goal.saved')}>
            <Input inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
        </div>
        <Field label={t('goal.deadline')}>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Icon">
          <div className="flex gap-1.5 flex-wrap">
            {GOAL_ICONS.map((i) => (
              <button key={i} onClick={() => setIcon(i)} type="button"
                className={'press w-10 h-10 rounded-xl grid place-items-center transition ' +
                  (icon === i ? 'bg-accentSoft text-accent ring-2 ring-accent' : 'bg-surface2 text-muted hover:text-ink')}>
                <Icon name={i} size={18} sw={2} />
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('acc.color')}>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_COLORS.slice(0, 8).map((c) => (
              <button key={c} onClick={() => setColor(c)} type="button"
                className={'press w-8 h-8 rounded-full ' + (color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : '')}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!name.trim() || !target} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}
export function ContributeModal({ open, onClose, payload }) {
  const { state, update, t, lang, showToast, fmtMoney } = useApp();
  const goal = payload?.goal;
  const [mode, setMode] = useState('in');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
  const [date, setDate] = useState(todayISO());
  if (!goal) return null;
  const numAmount = parseFloat(amount) || 0;
  const saved = goalSaved(goal, state.transactions);
  const remaining = Math.max(0, goal.target - saved);
  const save = () => {
    if (numAmount <= 0) return;
    const delta = mode === 'in' ? numAmount : -numAmount;
    const beforeSaved = goalSaved(goal, state.transactions);
    const afterSaved = Math.max(0, beforeSaved + delta);
    const milestone = checkGoalMilestone(goal, beforeSaved, afterSaved);
    const tx = { id: uid('tx'), type: 'goal', amount: delta, accountId, goalId: goal.id, date, note: { ar: '', en: '' } };
    update((s) => ({ transactions: [tx, ...s.transactions] }));
    if (milestone === 100) showToast(t('goal.milestone'), 'good');
    else if (milestone) showToast(milestone + '% — ' + goal.name[lang], 'good');
    else showToast(t('goal.added'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={goal.name[lang]}>
      <div className="mb-5 p-4 rounded-2xl bg-surface2">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[12px] text-muted font-semibold">{t('goal.saved')}</span>
          <span className="text-[13px] font-bold num truncate">{fmtMoney(saved)} / {fmtMoney(goal.target)}</span>
        </div>
        <Progress value={(saved / Math.max(1, goal.target)) * 100} color={goal.color} />
        <div className="flex justify-between mt-2 text-[11.5px]">
          <span className="text-muted num">{Math.round((saved / Math.max(1, goal.target)) * 100)}%</span>
          <span className="text-muted num">{t('goal.remaining')}: {fmtMoney(remaining)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => setMode('in')} type="button"
          className={'press h-11 rounded-xl border text-[13px] font-bold transition ' +
            (mode === 'in' ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted')}>
          {t('goal.contribute')}
        </button>
        <button onClick={() => setMode('out')} type="button"
          className={'press h-11 rounded-xl border text-[13px] font-bold transition ' +
            (mode === 'out' ? 'border-danger bg-dangerSoft text-danger' : 'border-line text-muted')}>
          {t('goal.withdraw')}
        </button>
      </div>
      <Field label={t('tx.amount')} className="mb-4">
        <Input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
      </Field>
      <Field label={t('goal.fromAcc')} className="mb-4">
        <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}
        </Select>
      </Field>
      <Field label={t('tx.date')}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={numAmount <= 0 || !accountId} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}