import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Btn, Field, Select, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { todayISO, addDays } from '../lib/utils';
function isIconName(str) {
  return typeof str === 'string' && /^[a-zA-Z]+$/.test(str) && str.length > 1 && str.length < 25;
}
export function TransactionsPage() {
  const { state, t, lang, fmtMoney, fmtDateShort, setModal, update, catById, accById, showToast } = useApp();
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [limit, setLimit] = useState(40);
  const [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return state.transactions.filter((x) => {
      if (filterType !== 'all' && x.type !== filterType) return false;
      if (s) {
        const cat = catById(x.categoryId);
        const acc = accById(x.accountId);
        const hay = [String(x.amount), x.note?.ar || '', x.note?.en || '', cat?.ar || '', cat?.en || '', acc?.name?.ar || '', acc?.name?.en || ''].join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [state.transactions, q, filterType, catById, accById]);
  const groups = useMemo(() => {
    const map = new Map();
    for (const x of filtered.slice(0, limit)) {
      if (!map.has(x.date)) map.set(x.date, []);
      map.get(x.date).push(x);
    }
    return Array.from(map.entries());
  }, [filtered, limit]);
  const del = (tx) => {
    setModal({ type: 'confirm', payload: {
      title: t('common.delete'),
      message: lang === 'ar' ? 'هتحذف العملية دي؟' : 'Delete this transaction?',
      onConfirm: () => {
        update((s) => ({ transactions: s.transactions.filter((x) => x.id !== tx.id) }));
        showToast(lang === 'ar' ? 'اتحذفت' : 'Deleted');
      },
    }});
  };
  return (
    <div className="space-y-4 anim-rise">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-[22px] font-extrabold">{t('nav.transactions')}</h1>
        <span className="text-[12px] font-semibold text-muted bg-surface2 px-2.5 py-1 rounded-full num">{filtered.length}</span>
        <div className="grow" />
        <Btn size="sm" onClick={() => setModal({ type: 'addTx' })}>
          <Icon name="plus" size={15} sw={2.4} /> {t('tx.add')}
        </Btn>
      </div>
      <div className="flex gap-2">
        <div className="field rounded-xl h-11 flex items-center gap-2 px-3.5 grow min-w-0">
          <Icon name="search" size={16} className="text-muted shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('tx.search')}
            className="grow bg-transparent text-[14px] outline-none placeholder:text-muted/70 min-w-0" />
          {q && <button onClick={() => setQ('')} className="text-muted hover:text-ink shrink-0"><Icon name="x" size={15} /></button>}
        </div>
        <button onClick={() => setShowFilters((v) => !v)}
          className={'press h-11 px-3.5 rounded-xl border text-[13px] font-semibold flex items-center gap-2 transition shrink-0 ' +
            (filterType !== 'all' ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted hover:text-ink')}>
          <Icon name="filter" size={15} />
        </button>
      </div>
      {showFilters && (
        <Card className="p-4 anim-fade">
          <Field label={t('tx.all')}>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">{t('tx.all')}</option>
              <option value="expense">{t('tx.expense')}</option>
              <option value="income">{t('tx.income')}</option>
              <option value="transfer">{t('tx.transfer')}</option>
              <option value="goal">{t('tx.goal')}</option>
            </Select>
          </Field>
        </Card>
      )}
      {filtered.length === 0 ? (
        <EmptyState icon="receipt" title={q ? t('tx.none') : t('tx.noTx')}
          action={!q ? () => setModal({ type: 'addTx' }) : null} actionLabel={t('tx.addFirst')} />
      ) : (
        <div className="space-y-5">
          {groups.map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[12px] font-bold text-muted">
                  {date === todayISO() ? t('tx.today') : date === addDays(todayISO(), -1) ? t('tx.yesterday') : fmtDateShort(date)}
                </span>
                <div className="grow h-px bg-line" />
              </div>
              <Card className="overflow-hidden divide-y divide-line">
                {txs.map((x) => <TxRow key={x.id} tx={x} onDelete={() => del(x)} />)}
              </Card>
            </div>
          ))}
          {filtered.length > limit && (
            <div className="text-center">
              <Btn variant="secondary" size="sm" onClick={() => setLimit((l) => l + 40)}>{t('common.showMore')}</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function TxRow({ tx, onDelete }) {
  const { state, t, lang, fmtMoney, catById, accById, setModal } = useApp();
  const cat = catById(tx.categoryId);
  const acc = accById(tx.accountId);
  const toAcc = accById(tx.toAccountId);
  const goal = state.goals.find((g) => g.id === tx.goalId);
  let iconName = cat?.icon || 'dot';
  let color = cat?.color || '#94A3B8';
  let title = tx.note?.[lang] || cat?.[lang] || t('tx.' + tx.type);
  let sub = acc?.name?.[lang] || '';
  let amountCls = 'text-ink';
  let sign = '';
  if (tx.type === 'income') { amountCls = 'text-accent'; sign = '+'; }
  else if (tx.type === 'expense') { amountCls = 'text-danger'; sign = '−'; }
  else if (tx.type === 'transfer') {
    amountCls = 'text-info'; iconName = 'repeat'; color = '#2563EB';
    sub = (acc?.name?.[lang] || '') + ' → ' + (toAcc?.name?.[lang] || '');
    title = tx.note?.[lang] || t('tx.transfer');
  } else if (tx.type === 'goal') {
    amountCls = 'text-accent'; iconName = goal?.icon || 'target'; color = goal?.color || '#0E9F6E';
    sub = acc?.name?.[lang] || '';
    title = (tx.amount < 0 ? '−' : '+') + fmtMoney(Math.abs(tx.amount)) + ' · ' + (goal?.name?.[lang] || '');
  }
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-surface2/50 transition">
      <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
        style={{ background: color + '20', color }}>
        <Icon name={iconName} size={18} sw={2} />
      </div>
      <button onClick={() => setModal({ type: 'editTx', payload: tx })} className="min-w-0 grow text-start">
        <div className="text-[13.5px] font-semibold truncate">{title}</div>
        <div className="text-[11.5px] text-muted truncate">{sub}</div>
      </button>
      <div className={'text-[13.5px] font-bold num shrink-0 ' + amountCls}>
        {tx.type === 'goal' ? '' : sign}{fmtMoney(tx.type === 'goal' ? Math.abs(tx.amount) : tx.amount)}
      </div>
      <button onClick={onDelete} className="press opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition shrink-0 ms-1">
        <Icon name="trash" size={15} />
      </button>
    </div>
  );
}