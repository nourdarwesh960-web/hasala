import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid } from '../../lib/utils';
import { Modal, Btn, Field, Input, Select } from '../ui';
import { Icon } from '../Icon';
export function BudgetModal({ open, onClose, edit }) {
  const { state, update, t, lang, showToast } = useApp();
  const expenseCats = state.categories.filter((c) => !c.id.startsWith('src_'));
  const [categoryId, setCategoryId] = useState(edit?.categoryId || expenseCats[0]?.id || '');
  const [amount, setAmount] = useState(edit ? String(edit.amount) : '');
  const save = () => {
    const amt = parseFloat(amount) || 0;
    if (!categoryId || amt <= 0) return;
    if (categoryId === '__general__') {
      const existing = state.budgets.find((b) => b.isGeneral);
      if (existing) {
        update((s) => ({ budgets: s.budgets.map((b) => b.id === existing.id ? { ...b, amount: amt } : b) }));
      } else {
        update((s) => ({ budgets: [...s.budgets, { id: uid('bud'), categoryId: null, isGeneral: true, amount: amt }] }));
      }
      showToast(t('common.save') + ' ✓', 'good');
      onClose();
      return;
    }
    if (categoryId === '__general__') {
      const existing = state.budgets.find((b) => b.isGeneral);
      if (existing) {
        update((s) => ({ budgets: s.budgets.map((b) => b.id === existing.id ? { ...b, amount: amt } : b) }));
      } else {
        update((s) => ({ budgets: [...s.budgets, { id: uid('bud'), categoryId: null, isGeneral: true, amount: amt }] }));
      }
      showToast(t('common.save') + ' ✓', 'good');
      onClose();
      return;
    }
    if (edit) {
      update((s) => ({ budgets: s.budgets.map((b) => b.id === edit.id ? { ...b, categoryId, amount: amt } : b) }));
    } else {
      const existing = state.budgets.find((b) => b.categoryId === categoryId);
      if (existing) {
        update((s) => ({ budgets: s.budgets.map((b) => b.id === existing.id ? { ...b, amount: amt } : b) }));
      } else {
        update((s) => ({ budgets: [...s.budgets, { id: uid('bud'), categoryId, amount: amt }] }));
      }
    }
    showToast(t('common.save') + ' ✓', 'good');
    onClose();
  };
  const selectedCat = expenseCats.find((c) => c.id === categoryId);
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('bud.add')}>
      <div className="space-y-4">
        {/* خيار الميزانية العامة */}
        <button
          type="button"
          onClick={() => setCategoryId('__general__')}
          className={'press w-full p-3 rounded-xl border text-start transition flex items-center gap-3 ' +
            (categoryId === '__general__' ? 'border-accent bg-accentSoft' : 'border-line hover:border-accent/40')}
        >
          <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(124,58,237,.15)', color: '#7C3AED' }}>
            <Icon name="wallet" size={18} sw={2} />
          </span>
          <span className="min-w-0">
            <span className={'block text-[13px] font-bold ' + (categoryId === '__general__' ? 'text-accent' : 'text-ink')}>
              {t('bud.general')}
            </span>
            <span className="block text-[11px] text-muted mt-0.5">{t('bud.generalDesc')}</span>
          </span>
        </button>
        {/* خيار الميزانية العامة */}
        <button
          type="button"
          onClick={() => setCategoryId('__general__')}
          className={'press w-full p-3 rounded-xl border text-start transition flex items-center gap-3 ' +
            (categoryId === '__general__' ? 'border-accent bg-accentSoft' : 'border-line hover:border-accent/40')}
        >
          <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(124,58,237,.15)', color: '#7C3AED' }}>
            <Icon name="wallet" size={18} sw={2} />
          </span>
          <span className="min-w-0">
            <span className={'block text-[13px] font-bold ' + (categoryId === '__general__' ? 'text-accent' : 'text-ink')}>
              {t('bud.general')}
            </span>
            <span className="block text-[11px] text-muted mt-0.5">{t('bud.generalDesc')}</span>
          </span>
        </button>
        <Field label={t('tx.category')}>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pe-1">
            {expenseCats.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
                className={'press h-11 px-3 rounded-xl border text-[13px] font-semibold flex items-center gap-2 transition ' +
                  (categoryId === c.id ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted hover:text-ink')}>
                <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                  style={{ background: c.color + '20', color: c.color }}>
                  <Icon name={c.icon} size={15} sw={2} />
                </span>
                <span className="truncate">{c[lang]}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('bud.limit')}>
          <div className="field rounded-2xl px-4 h-14 flex items-center">
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0"
              className="grow bg-transparent text-[22px] font-extrabold num text-ink placeholder:text-muted/40 w-full outline-none"
            />
            <span className="text-[13px] font-bold text-muted shrink-0">
              {state.settings.currency === 'EGP' ? 'ج.م' : state.settings.currency}
            </span>
          </div>
        </Field>
        {selectedCat && amount && parseFloat(amount) > 0 && (
          <div className="p-3 rounded-xl bg-accentSoft text-accent flex items-center gap-2">
            <Icon name={selectedCat.icon} size={16} sw={2} />
            <span className="text-[12.5px] font-semibold">
              {selectedCat[lang]} · {amount} {state.settings.currency === 'EGP' ? 'ج.م' : state.settings.currency}
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!categoryId || !amount || parseFloat(amount) <= 0} className="flex-1">
          {t('common.save')}
        </Btn>
      </div>
    </Modal>
  );
}