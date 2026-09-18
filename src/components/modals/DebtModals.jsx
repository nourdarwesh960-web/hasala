import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid, todayISO } from '../../lib/utils';
import { Modal, Btn, Field, Input, Progress } from '../ui';
export function DebtModal({ open, onClose, edit, payload }) {
  const { update, t, lang, showToast } = useApp();
  const [kind, setKind] = useState(edit?.kind || payload?.kind || 'owe');
  const [person, setPerson] = useState(edit?.person?.[lang] || '');
  const [amount, setAmount] = useState(edit ? String(edit.amount) : '');
  const [paid, setPaid] = useState(edit ? String(edit.paid || 0) : '0');
  const [date, setDate] = useState(edit?.date || todayISO());
  const [dueDate, setDueDate] = useState(edit?.dueDate || '');
  const [note, setNote] = useState(edit?.note?.[lang] || '');
  const save = () => {
    if (!person.trim() || !amount) return;
    const obj = {
      kind,
      person: { ar: person, en: person },
      amount: parseFloat(amount) || 0,
      paid: parseFloat(paid) || 0,
      date, dueDate: dueDate || null,
      note: { ar: note, en: note },
    };
    if (edit) update((s) => ({ debts: s.debts.map((d) => d.id === edit.id ? { ...d, ...obj } : d) }));
    else update((s) => ({ debts: [...s.debts, { id: uid('debt'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : (kind === 'owe' ? t('debt.addOwe') : t('debt.addOwed'))}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => setKind('owe')}
          className={'press h-11 rounded-xl border text-[13px] font-bold transition ' +
            (kind === 'owe' ? 'border-danger bg-dangerSoft text-danger' : 'border-line text-muted')}>
          {t('debt.iOwe')}
        </button>
        <button onClick={() => setKind('owed')}
          className={'press h-11 rounded-xl border text-[13px] font-bold transition ' +
            (kind === 'owed' ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted')}>
          {t('debt.owedToMe')}
        </button>
      </div>
      <div className="space-y-4">
        <Field label={t('debt.person')}>
          <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder={t('debt.personPh')} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('debt.amount')}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
          <Field label={t('debt.paid')}>
            <Input inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('tx.date')}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t('debt.dueDate')}>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <Field label={t('tx.note')}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!person.trim() || !amount} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}
export function PayDebtModal({ open, onClose, payload }) {
  const { update, t, showToast, fmtMoney } = useApp();
  const debt = payload?.debt;
  const [amount, setAmount] = useState('');
  if (!debt) return null;
  const remaining = Math.max(0, debt.amount - (debt.paid || 0));
  const numAmount = parseFloat(amount) || 0;
  const save = () => {
    if (numAmount <= 0) return;
    update((s) => ({
      debts: s.debts.map((d) => d.id === debt.id ? { ...d, paid: Math.min(d.amount, (d.paid || 0) + numAmount) } : d),
    }));
    showToast(fmtMoney(numAmount), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={debt.person.ar} size="sm">
      <div className="mb-4 p-4 rounded-2xl bg-surface2">
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] text-muted font-semibold">{t('debt.remaining')}</span>
          <span className="text-[15px] font-extrabold num">{fmtMoney(remaining)}</span>
        </div>
        <Progress className="mt-2.5" value={((debt.paid || 0) / debt.amount) * 100}
          color={debt.kind === 'owe' ? 'var(--danger)' : 'var(--accent)'} />
      </div>
      <Field label={t('tx.amount')} className="mb-4">
        <Input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
      </Field>
      <div className="flex gap-2 mb-5">
        {[remaining / 2, remaining].map((v, i) => (
          <button key={i} onClick={() => setAmount(String(Math.round(v * 100) / 100))}
            className="press flex-1 h-9 rounded-xl bg-surface2 text-[12px] font-bold text-muted hover:text-ink">
            {i === 0 ? '50%' : t('debt.settle')}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={numAmount <= 0} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}