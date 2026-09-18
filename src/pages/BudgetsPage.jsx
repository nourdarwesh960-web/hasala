import { useApp } from '../context/AppContext';
import { Card, Btn, EmptyState, IconBtn } from '../components/ui';
import { Icon } from '../components/Icon';
import { monthStats } from '../lib/finance';
import { todayISO } from '../lib/utils';
export function BudgetsPage() {
  const { state, update, t, lang, fmtMoney, setModal, showToast, catById } = useApp();
  const thisM = monthStats(state, todayISO());
  const totalBudget = state.budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = state.budgets.reduce((s, b) => s + (thisM.byCat[b.categoryId] || 0), 0);
  const totalLeft = totalBudget - totalSpent;
  const del = (b) => {
    setModal({
      type: 'confirm',
      payload: {
        title: t('common.delete'),
        message: lang === 'ar' ? 'هتحذف الميزانية دي؟' : 'Remove this budget?',
        onConfirm: () => {
          update((s) => ({ budgets: s.budgets.filter((x) => x.id !== b.id) }));
          showToast(lang === 'ar' ? 'اتحذفت' : 'Removed');
        },
      },
    });
  };
  if (state.budgets.length === 0) {
    return (
      <div className="space-y-5 anim-rise">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[22px] font-extrabold">{t('bud.title')}</h1>
          <div className="grow" />
          <Btn size="sm" onClick={() => setModal({ type: 'addBudget' })}>
            <Icon name="plus" size={15} sw={2.4} />
            <span>{t('bud.add')}</span>
          </Btn>
        </div>
        <EmptyState
          icon="pie"
          title={t('bud.none')}
          action={() => setModal({ type: 'addBudget' })}
          actionLabel={t('bud.addFirst')}
        />
      </div>
    );
  }
  return (
    <div className="space-y-5 anim-rise">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-[22px] font-extrabold">{t('bud.title')}</h1>
        <div className="grow" />
        <Btn size="sm" onClick={() => setModal({ type: 'addBudget' })}>
          <Icon name="plus" size={15} sw={2.4} />
          <span>{t('bud.add')}</span>
        </Btn>
      </div>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-muted mb-1">{t('bud.totalBudget')}</div>
          <div className="text-[18px] font-extrabold num truncate">{fmtMoney(totalBudget)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-muted mb-1">{t('bud.totalSpent')}</div>
          <div className="text-[18px] font-extrabold num text-danger truncate">{fmtMoney(totalSpent)}</div>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-muted mb-1">{t('bud.left')}</div>
          <div className={'text-[18px] font-extrabold num truncate ' + (totalLeft < 0 ? 'text-danger' : 'text-accent')}>
            {fmtMoney(totalLeft)}
          </div>
        </Card>
      </div>
      {/* Budget List */}
      <div className="space-y-3">
        {state.budgets.map((b) => {
const cat = b.isGeneral ? { color: '#7C3AED', icon: 'wallet', ar: t('bud.general'), en: t('bud.general') } : catById(b.categoryId);
          if (!cat) return null;
const spent = b.isGeneral
            ? (thisM.byBudget[b.id] || 0)
            : ((thisM.byBudget[b.id] !== undefined)
                ? thisM.byBudget[b.id]
                : (b.categoryId ? (thisM.byCat[b.categoryId] || 0) : 0));
          const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
          const remaining = b.amount - spent;
          const over = pct >= 100;
          const warn = pct >= 80 && !over;
          const barColor = over ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--accent)';
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                  style={{
                    background: b.isGeneral ? 'rgba(124,58,237,.15)' : cat.color + '20',
                    color: b.isGeneral ? '#7C3AED' : cat.color,
                  }}
                >
                  <Icon name={b.isGeneral ? 'wallet' : cat.icon} size={20} sw={2} />
                </div>
                <div className="grow min-w-0">
                  <div className="text-[14px] font-bold truncate">
                    {b.isGeneral ? t('bud.general') : cat[lang]}
                  </div>
                  <div className="text-[11.5px] text-muted num truncate">
                    {fmtMoney(spent)} / {fmtMoney(b.amount)}
                  </div>
                </div>
                <div
                  className={
                    'text-[15px] font-extrabold num shrink-0 ' +
                    (over ? 'text-danger' : warn ? 'text-warn' : 'text-accent')
                  }
                >
                  {Math.round(pct)}%
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <IconBtn
                    name="edit"
                    size={14}
                    onClick={() => setModal({ type: 'editBudget', payload: b })}
                  />
                  <IconBtn name="trash" size={14} onClick={() => del(b)} />
                </div>
              </div>
              <div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 7 }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: Math.min(100, pct) + '%', background: barColor }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[11.5px] gap-2">
                <span className="text-muted truncate">
                  {over ? t('bud.over') : warn ? t('bud.almost') : ''}
                </span>
                <span className={'num font-semibold shrink-0 ' + (over ? 'text-danger' : 'text-muted')}>
                  {over ? '-' : ''}
                  {fmtMoney(Math.abs(remaining))}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}