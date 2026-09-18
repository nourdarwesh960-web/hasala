import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '../../lib/constants';
import { uid } from '../../lib/utils';
import { Modal, Btn, Field, Input } from '../ui';
export function AccountModal({ open, onClose, edit }) {
  const { state, update, t, lang, showToast } = useApp();
  const [name, setName] = useState(edit?.name?.[lang] || '');
  const [type, setType] = useState(edit?.type || 'bank');
  const [bal, setBal] = useState(edit ? String(edit.initialBalance) : '0');
  const [color, setColor] = useState(edit?.color || ACCOUNT_COLORS[0]);
  const save = () => {
    if (!name.trim()) return;
    const obj = { name: { ar: name, en: name }, type, initialBalance: parseFloat(bal) || 0, currency: state.settings.currency, color, note: '' };
    if (edit) update((s) => ({ accounts: s.accounts.map((a) => a.id === edit.id ? { ...a, ...obj } : a) }));
    else update((s) => ({ accounts: [...s.accounts, { id: uid('acc'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('acc.add')}>
      <div className="space-y-4">
        <Field label={t('acc.name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('acc.namePh')} autoFocus />
        </Field>
        <Field label={t('acc.type')}>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_TYPES.map((at) => (
              <button key={at} onClick={() => setType(at)}
                className={'press h-9 px-3 rounded-xl text-[12.5px] font-semibold border transition ' +
                  (type === at ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted hover:text-ink')}>
                {t('type.' + at)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('acc.balance')} hint={type === 'credit' ? (lang === 'ar' ? 'لو عليك فلوس، اكتب بالسالب' : 'If you owe money, use a negative number') : undefined}>
          <Input inputMode="decimal" value={bal} onChange={(e) => setBal(e.target.value.replace(/[^\d.-]/g, ''))} />
        </Field>
        <Field label={t('acc.color')}>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={'press w-8 h-8 rounded-full transition ' + (color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : '')}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!name.trim()} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}