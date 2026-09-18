import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid, todayISO, clamp } from '../../lib/utils';
import { installmentStats } from '../../lib/finance';
import { Modal, Btn, Field, Input, Select } from '../ui';
import { Icon } from '../Icon';
const INSTALLMENT_ICONS = ['credit', 'laptop', 'house', 'car', 'plane', 'book', 'briefcase', 'clock', 'tag', 'gift'];
const INSTALLMENT_COLORS = ['#7C3AED', '#2563EB', '#0E9F6E', '#DB2777', '#EA580C', '#0891B2'];
export function InstallmentModal({ open, onClose, edit }) {
  const { state, update, t, lang, showToast } = useApp();
  const [name, setName] = useState(edit?.name?.[lang] || '');
  const [total, setTotal] = useState(edit ? String(edit.total) : '');
  const [count, setCount] = useState(edit ? String(edit.count) : '12');
  const [paidCount, setPaidCount] = useState(edit ? String(edit.paidCount || 0) : '0');
  const [startDate, setStartDate] = useState(edit?.startDate || todayISO());
  const [accountId, setAccountId] = useState(edit?.accountId || state.accounts[0]?.id || '');
  const [icon, setIcon] = useState(edit?.icon || 'credit');
  const [color, setColor] = useState(edit?.color || '#7C3AED');
  const numTotal = parseFloat(total) || 0;
  const numCount = parseInt(count) || 0;
  const monthly = numCount > 0 ? numTotal / numCount : 0;
  const save = () => {
    if (!name.trim() || numTotal <= 0 || numCount <= 0) return;
    const obj = {
      name: { ar: name, en: name }, total: numTotal, count: numCount, monthly,
      paidCount: clamp(parseInt(paidCount) || 0, 0, numCount),
      startDate, accountId, icon, color,
    };
    if (edit) update((s) => ({ installments: s.installments.map((x) => x.id === edit.id ? { ...x, ...obj } : x) }));
    else update((s) => ({ installments: [...s.installments, { id: uid('inst'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('inst.add')}>
      <div className="space-y-4">
        <Field label={t('rec.name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus
            placeholder={lang === 'ar' ? 'مثلاً: آيفون 17 برو' : 'e.g. iPhone 17 Pro'} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label={t('inst.totalPrice')}>
            <Input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </Field>
          <Field label={t('inst.count')}>
            <Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))} placeholder="12" />
          </Field>
          <Field label={t('inst.paidSoFar')}>
            <Input inputMode="numeric" value={paidCount} onChange={(e) => setPaidCount(e.target.value.replace(/\D/g, ''))} placeholder="0" />
          </Field>
        </div>
        {numTotal > 0 && numCount > 0 && (
          <div className="p-3 rounded-2xl bg-accentSoft text-accent flex items-center justify-between">
            <span className="text-[12.5px] font-semibold">{t('inst.perMonth')}</span>
            <span className="text-[15px] font-extrabold num truncate">{new Intl.NumberFormat('en-US').format(Math.round(monthly))}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('inst.startDate')}>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label={t('tx.account')}>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Icon">
          <div className="flex gap-1.5 flex-wrap">
            {INSTALLMENT_ICONS.map((i) => (
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
            {INSTALLMENT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} type="button"
                className={'press w-8 h-8 rounded-full ' + (color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : '')}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!name.trim() || numTotal <= 0 || numCount <= 0} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}
export function PayInstallmentModal({ open, onClose, payload }) {
  const { update, t, lang, fmtMoney, showToast } = useApp();
  const inst = payload?.inst;
  const [count, setCount] = useState('1');
  if (!inst) return null;
  const stats = installmentStats(inst);
  const numCount = clamp(parseInt(count) || 1, 1, stats.remainingCount);
  const save = () => {
    const payAmount = stats.monthly * numCount;
    const tx = {
      id: uid('tx'), type: 'expense', amount: payAmount,
      categoryId: 'cat_other', accountId: inst.accountId, date: todayISO(),
      note: { ar: inst.name.ar + ' — قسط', en: inst.name.en + ' — Installment' },
      installmentId: inst.id,
    };
    update((s) => ({
      transactions: [tx, ...s.transactions],
      installments: s.installments.map((x) => x.id === inst.id
        ? { ...x, paidCount: Math.min(x.count, (x.paidCount || 0) + numCount) } : x),
    }));
    showToast(fmtMoney(payAmount), 'good');
    onClose();
  };
  const options = Array.from(new Set([1, 2, 3, stats.remainingCount])).filter((v) => v > 0 && v <= stats.remainingCount);
  return (
    <Modal open={open} onClose={onClose} title={t('inst.payOne')} size="sm">
      <div className="mb-4 p-4 rounded-2xl bg-surface2">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[12px] text-muted font-semibold">{t('inst.remaining')}</span>
          <span className="text-[14px] font-bold num truncate">{fmtMoney(stats.remainingAmount)}</span>
        </div>
        <div className="text-[11.5px] text-muted truncate">
          {stats.paidCount} / {inst.count} · {t('inst.monthly')} {fmtMoney(stats.monthly)}
        </div>
      </div>
      <Field label={t('inst.howMany')} className="mb-4">
        <div className="flex gap-2">
          {options.map((v) => (
            <button key={v} onClick={() => setCount(String(v))} type="button"
              className={'press flex-1 h-11 rounded-xl border text-[13px] font-bold transition num ' +
                (numCount === v ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted')}>
              {v}
            </button>
          ))}
        </div>
      </Field>
      <div className="p-4 rounded-2xl bg-accentSoft flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-accent">{t('tx.amount')}</span>
        <span className="text-[16px] font-extrabold num text-accent truncate">{fmtMoney(stats.monthly * numCount)}</span>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} className="flex-1">{t('inst.confirmPay')}</Btn>
      </div>
    </Modal>
  );
}