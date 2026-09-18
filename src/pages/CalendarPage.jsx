import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, IconBtn } from '../components/ui';
import { todayISO, daysBetween } from '../lib/utils';
export function CalendarPage() {
  const { state, t, lang, fmtMoney, fmtDateShort, setModal } = useApp();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState(todayISO());
  const events = useMemo(() => {
    const map = {};
    const add = (date, ev) => { if (!map[date]) map[date] = []; map[date].push(ev); };
    for (const r of state.recurring) add(r.nextDate, { type: 'recurring', name: r.name, amount: -r.amount, icon: 'R' });
    for (const r of state.reminders) if (!r.done) add(r.date, { type: 'reminder', name: r.name, amount: -r.amount, icon: 'B' });
    for (const d of state.debts) {
      if (d.dueDate) {
        const rem = Math.max(0, d.amount - (d.paid || 0));
        if (rem > 0) add(d.dueDate, { type: 'debt', name: d.person, amount: d.kind === 'owe' ? -rem : rem, icon: d.kind === 'owe' ? '-' : '+' });
      }
    }
    for (const tx of state.transactions) {
      if (tx.type === 'income') add(tx.date, { type: 'income', name: tx.note?.[lang] || t('tx.income'), amount: tx.amount, icon: '$' });
    }
    return map;
  }, [state, lang, t]);
  const weekStart = lang === 'ar' ? 6 : 0;
  const orderedDays = lang === 'ar' ? ['السبت','الأحد','الاتنين','التلات','الأربع','الخميس','الجمعة'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const startOffset = (first.getDay() - weekStart + 7) % 7;
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(todayISO(new Date(cursor.y, cursor.m, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor, weekStart]);
  const monthTitle = new Date(cursor.y, cursor.m, 1).toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'long', year: 'numeric' });
  const selectedEvents = events[selected] || [];
  const today = todayISO();
  const prev = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const next = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
  return (
    <div className="space-y-5 anim-rise">
      <h1 className="text-[22px] font-extrabold">{t('cal.title')}</h1>
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <IconBtn name={lang === 'ar' ? 'chevronRight' : 'chevronLeft'} onClick={prev} />
          <span className="text-[15px] font-bold">{monthTitle}</span>
          <IconBtn name={lang === 'ar' ? 'chevronLeft' : 'chevronRight'} onClick={next} />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {orderedDays.map((d, i) => <div key={i} className="text-center text-[10.5px] font-bold text-muted py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const evs = events[iso] || [];
            const isToday = iso === today;
            const isSel = iso === selected;
            const day = Number(iso.slice(8, 10));
            const hasIncome = evs.some((e) => e.amount > 0);
            const hasExpense = evs.some((e) => e.amount < 0);
            return (
              <button key={i} onClick={() => setSelected(iso)}
                className={'press aspect-square rounded-xl flex flex-col items-center justify-center relative transition ' +
                  (isSel ? 'bg-accent text-white dark:text-[#04150E]' : isToday ? 'bg-accentSoft text-accent' : 'hover:bg-surface2 text-ink')}>
                <span className="text-[13px] font-semibold num">{day}</span>
                {evs.length > 0 && (
                  <div className="flex gap-0.5 absolute bottom-1.5">
                    {hasIncome && <span className={'w-1 h-1 rounded-full ' + (isSel ? 'bg-white/80' : 'bg-accent')} />}
                    {hasExpense && <span className={'w-1 h-1 rounded-full ' + (isSel ? 'bg-white/80' : 'bg-danger')} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line">
          <div className="text-[13.5px] font-bold">{fmtDateShort(selected)}</div>
        </div>
        {selectedEvents.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-muted">{t('cal.none')}</div>
        ) : (
          <div className="divide-y divide-line">
            {selectedEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-[16px]">{e.icon}</span>
                <span className="text-[13.5px] font-semibold grow truncate">{e.name[lang]}</span>
                <span className={'text-[13.5px] font-bold num ' + (e.amount > 0 ? 'text-accent' : 'text-danger')}>
                  {e.amount > 0 ? '+' : '-'}{fmtMoney(Math.abs(e.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      {state.reminders.filter((r) => !r.done).length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold">{t('rem.title')}</h3>
            <button onClick={() => setModal({ type: 'addReminder' })} className="press text-[12px] font-semibold text-accent">+ {t('rem.add')}</button>
          </div>
          <div className="space-y-2.5">
            {state.reminders.filter((r) => !r.done).map((r) => {
              const days = daysBetween(today, r.date);
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <button onClick={() => setModal({ type: 'editReminder', payload: r })} className="grow text-start min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{r.name[lang]}</div>
                    <div className="text-[11.5px] text-muted">
                      {days < 0 ? <span className="text-danger font-semibold">{t('rem.overdue')}</span>
                        : days === 0 ? <span className="text-warn font-semibold">{t('rem.today')}</span>
                        : days === 1 ? <span className="text-warn">{t('rem.tomorrow')}</span>
                        : t('rem.inDays', { n: days })}
                    </div>
                  </button>
                  <span className="text-[13px] font-bold num">{fmtMoney(r.amount)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}