import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid, todayISO } from '../../lib/utils';
import { Modal, Btn, Field, Input, Select } from '../ui';
export function RecurringModal({ open, onClose, edit }) {
  const { state, update, t, lang, showToast } = useApp();
  const [name, setName] = useState(edit?.name?.[lang] || '');
  const [amount, setAmount] = useState(edit ? String(edit.amount) : '');
  const [frequency, setFrequency] = useState(edit?.frequency || 'monthly');
  const [nextDate, setNextDate] = useState(edit?.nextDate || todayISO());
  const [accountId, setAccountId] = useState(edit?.accountId || state.accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(edit?.categoryId || 'cat_bills');
  const save = () => {
    if (!name.trim() || !amount) return;
    const obj = { name: { ar: name, en: name }, amount: parseFloat(amount) || 0, frequency, nextDate, accountId, categoryId };
    if (edit) update((s) => ({ recurring: s.recurring.map((r) => r.id === edit.id ? { ...r, ...obj } : r) }));
    else update((s) => ({ recurring: [...s.recurring, { id: uid('rec'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('rec.add')}>
      <div className="space-y-4">
        <Field label={t('rec.name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus
            placeholder={lang === 'ar' ? 'مثلاً: نتفليكس' : 'e.g. Netflix'} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('tx.amount')}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
          <Field label={t('rec.freq')}>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
                <option key={f} value={f}>{t('rec.' + f)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('rec.nextDate')}>
            <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </Field>
          <Field label={t('tx.account')}>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t('tx.category')}>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {state.categories.filter((c) => !c.id.startsWith('src_')).map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c[lang]}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!name.trim() || !amount} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}
export function ReminderModal({ open, onClose, edit }) {
  const { update, t, lang, showToast } = useApp();
  const [name, setName] = useState(edit?.name?.[lang] || '');
  const [amount, setAmount] = useState(edit ? String(edit.amount) : '');
  const [date, setDate] = useState(edit?.date || todayISO());
  const save = () => {
    if (!name.trim()) return;
    const obj = { name: { ar: name, en: name }, amount: parseFloat(amount) || 0, date, done: false };
    if (edit) update((s) => ({ reminders: s.reminders.map((r) => r.id === edit.id ? { ...r, ...obj } : r) }));
    else update((s) => ({ reminders: [...s.reminders, { id: uid('rem'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('rem.add')} size="sm">
      <div className="space-y-4">
        <Field label={t('rec.name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('tx.amount')}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
          <Field label={t('tx.date')}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!name.trim()} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}