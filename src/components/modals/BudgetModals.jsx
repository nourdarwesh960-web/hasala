import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid, todayISO } from '../../lib/utils';
import { Modal, Btn, Field } from '../ui';
import { Icon } from '../Icon';

export function BudgetModal({ open, onClose, edit }) {
  const { state, update, t, lang, showToast } = useApp();

  const expenseCats = state.categories.filter(
    (c) => !c.id.startsWith('src_')
  );

  const [categoryId, setCategoryId] = useState(
    edit?.isGeneral
      ? '__general__'
      : edit?.categoryId || expenseCats[0]?.id || ''
  );

  const [amount, setAmount] = useState(
    edit ? String(edit.amount) : ''
  );

  const [startDate, setStartDate] = useState(
    edit?.startDate || todayISO()
  );

  const [endDate, setEndDate] = useState(
    edit?.endDate || todayISO()
  );

  const save = () => {
    const amt = parseFloat(amount) || 0;

    if (!categoryId || amt <= 0) return;

    if (!startDate || !endDate || endDate < startDate) {
      showToast(
        lang === 'ar'
          ? '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0646\u0647\u0627\u064a\u0629 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0628\u0639\u062f \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0627\u064a\u0629'
          : 'End date must be after the start date',
        'bad'
      );
      return;
    }

    const budgetData = {
      amount: amt,
      startDate,
      endDate,
    };

    // General budget
    if (categoryId === '__general__') {
      const existing = state.budgets.find((b) => b.isGeneral);

      if (existing) {
        update((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === existing.id
              ? {
                  ...b,
                  ...budgetData,
                  categoryId: null,
                  isGeneral: true,
                }
              : b
          ),
        }));
      } else {
        update((s) => ({
          budgets: [
            ...s.budgets,
            {
              id: uid('bud'),
              categoryId: null,
              isGeneral: true,
              ...budgetData,
            },
          ],
        }));
      }

      showToast(t('common.save') + ' ✓', 'good');
      onClose();
      return;
    }

    // Edit existing budget
    if (edit) {
      update((s) => ({
        budgets: s.budgets.map((b) =>
          b.id === edit.id
            ? {
                ...b,
                ...budgetData,
                categoryId,
                isGeneral: false,
              }
            : b
        ),
      }));
    } else {
      // Keep one budget per category
      const existing = state.budgets.find(
        (b) => !b.isGeneral && b.categoryId === categoryId
      );

      if (existing) {
        update((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === existing.id
              ? {
                  ...b,
                  ...budgetData,
                  categoryId,
                  isGeneral: false,
                }
              : b
          ),
        }));
      } else {
        update((s) => ({
          budgets: [
            ...s.budgets,
            {
              id: uid('bud'),
              categoryId,
              isGeneral: false,
              ...budgetData,
            },
          ],
        }));
      }
    }

    showToast(t('common.save') + ' ✓', 'good');
    onClose();
  };

  const selectedCat = expenseCats.find(
    (c) => c.id === categoryId
  );

  const currency =
    state.settings.currency === 'EGP'
      ? '\u062c.\u0645'
      : state.settings.currency;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edit ? t('common.edit') : t('bud.add')}
    >
      <div className="space-y-4">

        {/* General Budget */}
        <button
          type="button"
          onClick={() => setCategoryId('__general__')}
          className={
            'press w-full p-3 rounded-xl border text-start transition flex items-center gap-3 ' +
            (categoryId === '__general__'
              ? 'border-accent bg-accentSoft'
              : 'border-line hover:border-accent/40')
          }
        >
          <span
            className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
            style={{
              background: 'rgba(124,58,237,.15)',
              color: '#7C3AED',
            }}
          >
            <Icon name="wallet" size={18} sw={2} />
          </span>

          <span className="min-w-0">
            <span
              className={
                'block text-[13px] font-bold ' +
                (categoryId === '__general__'
                  ? 'text-accent'
                  : 'text-ink')
              }
            >
              {t('bud.general')}
            </span>

            <span className="block text-[11px] text-muted mt-0.5">
              {t('bud.generalDesc')}
            </span>
          </span>
        </button>

        {/* Categories */}
        <Field label={t('tx.category')}>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pe-1">
            {expenseCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={
                  'press h-11 px-3 rounded-xl border text-[13px] font-semibold flex items-center gap-2 transition ' +
                  (categoryId === c.id
                    ? 'border-accent bg-accentSoft text-accent'
                    : 'border-line text-muted hover:text-ink')
                }
              >
                <span
                  className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                  style={{
                    background: c.color + '20',
                    color: c.color,
                  }}
                >
                  <Icon name={c.icon} size={15} sw={2} />
                </span>

                <span className="truncate">
                  {c[lang]}
                </span>
              </button>
            ))}
          </div>
        </Field>

        {/* Amount */}
        <Field label={t('bud.limit')}>
          <div className="field rounded-2xl px-4 h-14 flex items-center">
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value.replace(/[^\d.]/g, '')
                )
              }
              placeholder="0"
              className="grow bg-transparent text-[22px] font-extrabold num text-ink placeholder:text-muted/40 w-full outline-none"
            />

            <span className="text-[13px] font-bold text-muted shrink-0">
              {currency}
            </span>
          </div>
        </Field>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">

          <Field
            label={
              lang === 'ar'
                ? '\u0645\u0646'
                : 'Start date'
            }
          >
            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="field w-full h-11 rounded-xl px-3 text-[13px] font-semibold text-ink outline-none"
            />
          </Field>

          <Field
            label={
              lang === 'ar'
                ? '\u0625\u0644\u0649'
                : 'End date'
            }
          >
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="field w-full h-11 rounded-xl px-3 text-[13px] font-semibold text-ink outline-none"
            />
          </Field>

        </div>

        {/* Preview */}
        {selectedCat &&
          amount &&
          parseFloat(amount) > 0 && (
            <div className="p-3 rounded-xl bg-accentSoft text-accent flex items-center gap-2">
              <Icon
                name={selectedCat.icon}
                size={16}
                sw={2}
              />

              <span className="text-[12.5px] font-semibold">
                {selectedCat[lang]} · {amount} {currency}
              </span>
            </div>
          )}

        {/* Smart Budget Info */}
        {amount &&
          parseFloat(amount) > 0 &&
          startDate &&
          endDate &&
          endDate >= startDate && (
            <div className="p-3 rounded-xl border border-line bg-surface2/50">
              <div className="text-[11px] text-muted mb-1">
                {lang === 'ar'
                  ? '\u0627\u0644\u062d\u062f \u0627\u0644\u064a\u0648\u0645\u064a \u0627\u0644\u062a\u0642\u0631\u064a\u0628\u064a'
                  : 'Estimated daily limit'}
              </div>

              <div className="text-[18px] font-extrabold num text-ink">
                {(
                  parseFloat(amount) /
                  (
                    Math.floor(
                      (
                        new Date(endDate + 'T00:00:00') -
                        new Date(startDate + 'T00:00:00')
                      ) /
                      86400000
                    ) + 1
                  )
                ).toFixed(2)}{' '}
                {currency}
              </div>

              <div className="text-[10.5px] text-muted mt-1">
                {lang === 'ar'
                  ? '\u0627\u0644\u0646\u0638\u0627\u0645 \u0647\u064a\u0639\u062f\u0644 \u0627\u0644\u062d\u062f \u0627\u0644\u064a\u0648\u0645\u064a \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0628\u0639\u062f \u0627\u0644\u0635\u0631\u0641'
                  : 'The daily limit will automatically adjust after spending.'}
              </div>
            </div>
          )}
      </div>

      <div className="flex gap-2 mt-6">
        <Btn
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          {t('common.cancel')}
        </Btn>

        <Btn
          onClick={save}
          disabled={
            !categoryId ||
            !amount ||
            parseFloat(amount) <= 0 ||
            !startDate ||
            !endDate ||
            endDate < startDate
          }
          className="flex-1"
        >
          {t('common.save')}
        </Btn>
      </div>
    </Modal>
  );
}