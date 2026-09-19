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
  const [personal, setPersonal] = useState(edit?.personal !== false);
  const save = () => {
    if (!name.trim()) return;
    const obj = { name: { ar: name, en: name }, type, initialBalance: parseFloat(bal) || 0, currency: state.settings.currency, color, note: '', personal };
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
        <Field label={lang === 'ar' ? '\u0646\u0648\u0639 \u0627\u0644\u062d\u0633\u0627\u0628' : 'Account ownership'}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPersonal(true)}
              className={
                'press h-10 rounded-xl text-[12.5px] font-semibold border transition ' +
                (personal
                  ? 'border-accent bg-accentSoft text-accent'
                  : 'border-line text-muted hover:text-ink')
              }
            >
              {lang === 'ar' ? '\u062d\u0633\u0627\u0628\u064a' : 'My Account'}
            </button>
            <button
              type="button"
              onClick={() => setPersonal(false)}
              className={
                'press h-10 rounded-xl text-[12.5px] font-semibold border transition ' +
                (!personal
                  ? 'border-accent bg-accentSoft text-accent'
                  : 'border-line text-muted hover:text-ink')
              }
            >
              {lang === 'ar' ? '\u0645\u0634 \u062d\u0633\u0627\u0628\u064a' : 'Not My Account'}
            </button>
          </div>
          {!personal && (
            <div className="text-[11px] text-muted mt-2 leading-5">
              {lang === 'ar'
                ? '\u0631\u0635\u064a\u062f \u0627\u0644\u062d\u0633\u0627\u0628 \u0645\u0634 \u0647\u064a\u062f\u062e\u0644 \u0641\u064a \u0625\u062c\u0645\u0627\u0644\u064a \u0623\u0645\u0648\u0627\u0644\u0643 \u0627\u0644\u0634\u062e\u0635\u064a\u0629.'
                : 'This account stays tracked, but it will not be included in your personal totals.'}
            </div>
          )}
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
