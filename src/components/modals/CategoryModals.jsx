import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ACCOUNT_COLORS } from '../../lib/constants';
import { uid } from '../../lib/utils';
import { Modal, Btn, Field, Input } from '../ui';
import { Icon } from '../Icon';
const ICON_CHOICES = [
  'utensils', 'car', 'shoppingBag', 'receipt', 'film', 'heart',
  'book', 'repeat', 'plane', 'house', 'tag', 'gift',
  'coffee', 'paw', 'dumbbell', 'music', 'smartphone', 'laptop',
  'palette', 'ball', 'briefcase', 'wallet',
];
export function CategoryModal({ open, onClose, edit }) {
  const { update, t, showToast } = useApp();
  const [ar, setAr] = useState(edit?.ar || '');
  const [en, setEn] = useState(edit?.en || '');
  const [icon, setIcon] = useState(edit?.icon || 'tag');
  const [color, setColor] = useState(edit?.color || ACCOUNT_COLORS[0]);
  const save = () => {
    if (!ar.trim() && !en.trim()) return;
    const obj = { ar: ar || en, en: en || ar, icon, color, custom: true };
    if (edit) update((s) => ({ categories: s.categories.map((c) => c.id === edit.id ? { ...c, ...obj } : c) }));
    else update((s) => ({ categories: [...s.categories, { id: uid('cat'), ...obj }] }));
    showToast(t('common.save'), 'good');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={edit ? t('common.edit') : t('set.addCategory')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="العربية">
            <Input value={ar} onChange={(e) => setAr(e.target.value)} autoFocus />
          </Field>
          <Field label="English">
            <Input value={en} onChange={(e) => setEn(e.target.value)} />
          </Field>
        </div>
        <Field label="Icon">
          <div className="flex gap-1.5 flex-wrap">
            {ICON_CHOICES.map((i) => (
              <button key={i} onClick={() => setIcon(i)}
                type="button"
                className={'press w-10 h-10 rounded-xl grid place-items-center transition ' +
                  (icon === i ? 'bg-accentSoft text-accent ring-2 ring-accent' : 'bg-surface2 text-muted hover:text-ink')}>
                <Icon name={i} size={18} sw={2} />
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('acc.color')}>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} type="button"
                className={'press w-8 h-8 rounded-full transition ' + (color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink' : '')}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
      </div>
      <div className="flex gap-2 mt-6">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!ar.trim() && !en.trim()} className="flex-1">{t('common.save')}</Btn>
      </div>
    </Modal>
  );
}