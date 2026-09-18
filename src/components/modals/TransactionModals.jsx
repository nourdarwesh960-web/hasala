import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CURRENCIES, INCOME_SOURCES } from '../../lib/constants';
import { uid, todayISO } from '../../lib/utils';
import { parseNatural } from '../../lib/finance';
import { Modal, Btn, Field, Input, Select } from '../ui';
import { Icon } from '../Icon';
export function AddTxModal({ open, onClose, edit, payload }) {
  const { state, update, t, lang, showToast, fmtMoney } = useApp();
  const isEdit = !!edit;
  const [type, setType] = useState(edit?.type || payload?.type || 'expense');
  const [amount, setAmount] = useState(edit ? String(edit.amount) : '');
  const [categoryId, setCategoryId] = useState(edit?.categoryId || '');
  const [accountId, setAccountId] = useState(edit?.accountId || state.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(edit?.toAccountId || '');
  const [date, setDate] = useState(edit?.date || todayISO());
  const [note, setNote] = useState(edit?.note?.[lang] || '');
  const [sourceId, setSourceId] = useState(edit?.sourceId || 'src_salary');
  const [budgetId, setBudgetId] = useState(edit?.budgetId || '');
  const [customBudgetName, setCustomBudgetName] = useState(edit?.budgetLabel || '');
  const [showCustomBudget, setShowCustomBudget] = useState(!!edit?.budgetLabel && !edit?.budgetId);
  useEffect(() => {
    if (isEdit) return;
    if (payload?.presetAmount) setAmount(String(payload.presetAmount));
    if (payload?.presetCategory) {
      if (payload.type === 'income') setSourceId(payload.presetCategory);
      else setCategoryId(payload.presetCategory);
    }
    if (payload?.presetAccount) setAccountId(payload.presetAccount);
    if (payload?.type) setType(payload.type);
  }, []);
  const numAmount = parseFloat(String(amount).replace(/,/g, '')) || 0;
  const allBudgets = useMemo(() => {
    const list = state.budgets || [];
    return list;
  }, [state.budgets]);
  const ensureGeneralBudgetInState = () => {
    const existing = state.budgets.find((b) => b.isGeneral);
    if (existing) return existing.id;
    const newId = 'bud_general_' + Math.random().toString(36).slice(2, 8);
    update((s) => ({
      budgets: [...s.budgets, { id: newId, categoryId: null, isGeneral: true, amount: 0 }],
    }));
    return newId;
  };
  const handleBudgetChange = (value) => {
    if (value === '__general__') {
      const id = ensureGeneralBudgetInState();
      setBudgetId(id);
      setShowCustomBudget(false);
    } else if (value === '__other__') {
      const id = ensureGeneralBudgetInState();
      setBudgetId(id);
      setShowCustomBudget(true);
    } else {
      setBudgetId(value);
      setShowCustomBudget(false);
      setCustomBudgetName('');
    }
  };
  const suggestion = useMemo(() => {
    const n = (note || '').toLowerCase();
    if (!n) return null;
    const rules = [
      { kw: ['uber', 'careem', 'أوبر', 'كريم', 'بنزين', 'fuel', 'petrol', 'تاكسي', 'taxi', 'مترو', 'metro', 'باص', 'bus'], cat: 'cat_trans' },
      { kw: ['netflix', 'spotify', 'subscription', 'اشتراك', 'شاهد', 'youtube', 'icloud'], cat: 'cat_subs' },
      { kw: ['amazon', 'أمازون', 'noon', 'نون', 'mall', 'مول', 'clothes', 'هدوم', 'shopping'], cat: 'cat_shop' },
      { kw: ['restaurant', 'مطعم', 'كافيه', 'coffee', 'قهوة', 'lunch', 'dinner', 'عشاء', 'فطار', 'supermarket', 'سوبر'], cat: 'cat_food' },
      { kw: ['internet', 'نت', 'كهربا', 'غاز', 'فاتورة', 'bill', 'rent', 'إيجار'], cat: 'cat_bills' },
      { kw: ['cinema', 'سينما', 'movie', 'فيلم', 'game', 'لعبة'], cat: 'cat_ent' },
      { kw: ['pharmacy', 'صيدلية', 'doctor', 'دكتور', 'hospital', 'مستشفى', 'دوا'], cat: 'cat_health' },
      { kw: ['course', 'كورس', 'book', 'كتاب', 'udemy', 'تعليم'], cat: 'cat_edu' },
      { kw: ['flight', 'طيران', 'ticket', 'تذكرة', 'hotel', 'فندق', 'travel', 'سفر'], cat: 'cat_travel' },
    ];
    for (const r of rules) {
      if (r.kw.some((k) => n.includes(k))) {
        const cat = state.categories.find((c) => c.id === r.cat);
        if (cat && cat.id !== categoryId) return cat;
      }
    }
    return null;
  }, [note, state.categories, categoryId]);
  const cats = state.categories;
  const canSave = numAmount > 0 && (type === 'transfer' ? (accountId && toAccountId && accountId !== toAccountId) : true);
  const save = () => {
    if (!canSave) return;
    const base = { type, amount: numAmount, date, note: { ar: note, en: note } };
    let tx;
    if (type === 'transfer') tx = { ...base, accountId, toAccountId, categoryId: null };
    else if (type === 'income') tx = { ...base, accountId, categoryId: sourceId, sourceId };
    else { const finalBudgetId = budgetId || null;
      const finalBudgetLabel = showCustomBudget && customBudgetName.trim() ? customBudgetName.trim() : null;
      tx = { ...base, accountId, categoryId: categoryId || 'cat_other', budgetId: finalBudgetId, budgetLabel: finalBudgetLabel }; }
    if (isEdit) {
      update((s) => ({ transactions: s.transactions.map((x) => x.id === edit.id ? { ...x, ...tx } : x) }));
      showToast(t('common.save'), 'good');
    } else {
      update((s) => ({ transactions: [{ id: uid('tx'), ...tx }, ...s.transactions] }));
      showToast(t('tx.save'), 'good');
    }
    onClose();
  };
  const recent = state.transactions.filter((x) => x.type === 'expense').slice(0, 12);
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('common.edit') : t('tx.whatAdd')}>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { v: 'expense', label: t('tx.expense'), icon: 'arrowUp' },
          { v: 'income', label: t('tx.income'), icon: 'arrowDown' },
          { v: 'transfer', label: t('tx.transfer'), icon: 'arrowRight' },
        ].map((o) => (
          <button key={o.v} onClick={() => setType(o.v)}
            className={'press h-12 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-2 transition ' +
              (type === o.v ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted hover:text-ink')}>
            <Icon name={o.icon} size={15} sw={2.2} />
            {o.label}
          </button>
        ))}
      </div>
      <div className="mb-5">
        <div className="text-[12px] font-semibold text-muted mb-1.5">{t('tx.amount')}</div>
        <div className="field rounded-2xl px-4 h-16 flex items-center gap-2">
          <input autoFocus inputMode="decimal" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0"
            className="grow bg-transparent text-[26px] font-extrabold num text-ink placeholder:text-muted/40 w-full" />
          <span className="text-[14px] font-bold text-muted shrink-0">
            {CURRENCIES[state.settings.currency]?.[lang]}
          </span>
        </div>
      </div>
      {!isEdit && (
        <div className="flex gap-2 mb-5 overflow-x-auto no-sb -mx-1 px-1">
          {[50, 100, 250, 500, 1000].map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className="press shrink-0 h-9 px-3.5 rounded-xl bg-surface2 text-[12.5px] font-bold text-muted hover:text-ink transition">
              +{v}
            </button>
          ))}
        </div>
      )}
      {type !== 'transfer' && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12px] font-semibold text-muted">
              {type === 'income' ? t('an.bySource') : t('tx.category')}
            </div>
            {suggestion && (
              <button onClick={() => setCategoryId(suggestion.id)}
                className="press text-[11.5px] font-bold text-accent flex items-center gap-1 anim-fade">
                <Icon name="sparkles" size={12} /> {suggestion.icon} {suggestion[lang]}
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(type === 'income' ? INCOME_SOURCES : cats.filter((c) => !c.id.startsWith('src_'))).map((c) => (
              <button key={c.id} onClick={() => type === 'income' ? setSourceId(c.id) : setCategoryId(c.id)}
                className={'press h-9 px-3 rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 transition border ' +
                  ((type === 'income' ? sourceId : categoryId) === c.id
                    ? 'border-accent bg-accentSoft text-accent'
                    : 'border-line text-muted hover:text-ink')}>
                <span>{c.icon}</span>{c[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Budget dropdown — فقط للمصروف */}
      {type === 'expense' && (
        <div className="mb-5">
          <div className="text-[12px] font-semibold text-muted mb-2">{t('tx.spendFrom')}</div>
          <Select
            value={
              showCustomBudget
                ? '__other__'
                : budgetId && allBudgets.find((b) => b.id === budgetId && b.isGeneral)
                  ? '__general__'
                  : budgetId || ''
            }
            onChange={(e) => handleBudgetChange(e.target.value)}
          >
            <option value="">{t('tx.budgetAuto')}</option>
            {allBudgets
              .filter((b) => !b.isGeneral && b.categoryId)
              .map((b) => {
                const cat = state.categories.find((c) => c.id === b.categoryId);
                if (!cat) return null;
                return (
                  <option key={b.id} value={b.id}>
                    {cat[lang]}
                  </option>
                );
              })}
            <option value="__general__">{t('tx.budgetGeneral')}</option>
            <option value="__other__">{t('tx.budgetOther')}</option>
          </Select>
          {showCustomBudget && (
            <Input
              value={customBudgetName}
              onChange={(e) => setCustomBudgetName(e.target.value)}
              placeholder={t('tx.customBudgetPh')}
              className="mt-2"
              autoFocus
            />
          )}
        </div>
      )}
      <div className={'grid gap-3 mb-5 ' + (type === 'transfer' ? 'grid-cols-2' : 'grid-cols-1')}>
        <Field label={type === 'transfer' ? t('tx.from') : t('tx.account')}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">{t('common.none')}</option>
            {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}
          </Select>
        </Field>
        {type === 'transfer' && (
          <Field label={t('tx.to')}>
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">{t('common.none')}</option>
              {state.accounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}
            </Select>
          </Field>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Field label={t('tx.date')}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t('tx.note')}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('tx.notePh')} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn onClick={save} disabled={!canSave} className="flex-[2]">{isEdit ? t('common.save') : t('tx.save')}</Btn>
      </div>
      {!isEdit && recent.length > 0 && !amount && (
        <div className="mt-6 pt-5 border-t border-line">
          <div className="text-[11.5px] font-semibold text-muted mb-2.5">{t('dash.quickAdd')}</div>
          <div className="flex gap-2 overflow-x-auto no-sb">
            {recent.slice(0, 6).map((r) => {
              const cat = state.categories.find((c) => c.id === r.categoryId);
              const acc = state.accounts.find((a) => a.id === r.accountId);
              return (
                <button key={r.id} onClick={() => {
                  setType('expense'); setAmount(String(r.amount));
                  setCategoryId(r.categoryId); setAccountId(r.accountId);
                }}
                  className="press shrink-0 px-3 py-2 rounded-xl bg-surface2 border border-line text-start">
                  <div className="text-[13px] font-bold num">{fmtMoney(r.amount)}</div>
                  <div className="text-[10.5px] text-muted mt-0.5 truncate max-w-[100px]">
                    {cat ? cat[lang] : ''} · {acc ? acc.name[lang] : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
export function QuickAddSheet({ open, onClose }) {
  const { t, setModal, lang } = useApp();
  const pick = (type) => {
    if (type === 'smart') { setModal({ type: 'smartAdd' }); onClose(); return; }
    setModal({ type: 'addTx', payload: { type } });
    onClose();
  };
  const opts = [
    { v: 'expense', label: t('tx.expense'), icon: 'arrowUp', color: 'text-danger', bg: 'bg-dangerSoft' },
    { v: 'income', label: t('tx.income'), icon: 'arrowDown', color: 'text-accent', bg: 'bg-accentSoft' },
    { v: 'transfer', label: t('tx.transfer'), icon: 'arrowRight', color: 'text-info', bg: 'bg-surface2' },
    { v: 'smart', label: lang === 'ar' ? 'اكتب بالعربي' : 'Type in words', icon: 'sparkles', color: 'text-accent', bg: 'bg-accentSoft' },
  ];
  return (
    <Modal open={open} onClose={onClose} title={t('tx.whatAdd')} size="sm">
      <div className="space-y-2.5 pb-2">
        {opts.map((o) => (
          <button key={o.v} onClick={() => pick(o.v)}
            className="press w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface2 border border-line hover:border-accent transition">
            <div className={'w-11 h-11 rounded-xl grid place-items-center ' + o.bg + ' ' + o.color}>
              <Icon name={o.icon} size={20} sw={2.2} />
            </div>
            <span className="font-bold text-[15px]">{o.label}</span>
            <Icon name="chevronRight" size={18} className="ms-auto text-muted flip" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
export function SmartAddModal({ open, onClose }) {
  const { state, t, lang, fmtMoney, setModal, showToast } = useApp();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  useEffect(() => { if (!open) { setText(''); setParsed(null); } }, [open]);
  const examples = lang === 'ar'
    ? ['دفعت 250 أكل من CIB', 'أوبر 185 كاش', 'قبضت 15000 راتب', 'نتفليكس 300']
    : ['Spent 250 food from CIB', 'Uber 185 cash', 'Received 15000 salary', 'Netflix 300'];
  const analyze = () => { if (!text.trim()) return; setParsed(parseNatural(text, state, lang)); };
  const confirm = () => {
    if (!parsed || parsed.amount <= 0) return;
    setModal({ type: 'addTx', payload: { type: parsed.type, presetAmount: parsed.amount, presetCategory: parsed.categoryId, presetAccount: parsed.accountId } });
    showToast(lang === 'ar' ? 'تأكد وعدّل لو محتاج' : 'Confirm & adjust', 'neutral');
  };
  if (!open) return null;
  const cat = parsed?.categoryId ? state.categories.find((c) => c.id === parsed.categoryId) : null;
  const acc = parsed?.accountId ? state.accounts.find((a) => a.id === parsed.accountId) : null;
  return (
    <Modal open={open} onClose={onClose} title={t('smart.title')}>
      <div className="mb-4">
        <div className="field rounded-2xl p-4">
          <textarea value={text}
            onChange={(e) => { setText(e.target.value); setParsed(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); } }}
            rows={2} autoFocus
            placeholder={t('smart.placeholder')}
            className="w-full bg-transparent resize-none text-[15px] text-ink placeholder:text-muted/70 outline-none" />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {examples.map((ex, i) => (
            <button key={i} onClick={() => { setText(ex); setParsed(parseNatural(ex, state, lang)); }}
              className="press text-[11.5px] px-2.5 py-1 rounded-lg bg-surface2 text-muted hover:text-ink transition">
              {ex}
            </button>
          ))}
        </div>
      </div>
      {parsed && parsed.amount > 0 && (
        <div className="p-4 rounded-2xl bg-accentSoft border border-accent/20 mb-4 anim-fade">
          <div className="text-[11px] font-bold text-accent mb-3">{t('smart.confirm')}</div>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">{t('tx.amount')}</span>
              <span className="font-extrabold num">{fmtMoney(parsed.amount)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">{t('tx.category')}</span>
              <span className="font-bold">{cat ? cat.icon + ' ' + cat[lang] : '—'}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">{t('tx.account')}</span>
              <span className="font-bold">{acc ? acc.name[lang] : '—'}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        {!parsed ? (
          <Btn onClick={analyze} disabled={!text.trim()} className="flex-1">{t('smart.analyze')}</Btn>
        ) : (
          <Btn onClick={confirm} disabled={parsed.amount <= 0} className="flex-1">{t('smart.confirmBtn')}</Btn>
        )}
      </div>
    </Modal>
  );
}