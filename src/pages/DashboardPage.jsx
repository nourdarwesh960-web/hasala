import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Donut } from '../components/charts';
import { monthStats, upcomingItems, goalSaved, getSurplus } from '../lib/finance';
import { todayISO } from '../lib/utils';
export function DashboardPage() {
  const { state, t, lang, fmtMoney, fmtDateShort, totals, insights, setModal, setPage } = useApp();
  const today = todayISO();
  const thisM = monthStats(state, today);
  const upcoming = upcomingItems(state, 30);
  const surplus = useMemo(() => getSurplus(state), [state]);
  const catData = useMemo(() => Object.entries(thisM.byCat).map(([cid, v]) => {
    const c = state.categories.find((x) => x.id === cid);
    return c ? { label: c[lang], value: v, color: c.color, icon: c.icon } : null;
  }).filter(Boolean).sort((a, b) => b.value - a.value), [thisM, state.categories, lang]);
  const isEmpty = state.accounts.length === 0 && state.transactions.length === 0;
  if (isEmpty) {
    return (
      <div className="anim-rise">
        <Card className="p-8 text-center hero-3d shine-sweep">
          <div className="w-16 h-16 rounded-2xl bg-accentSoft text-accent grid place-items-center mx-auto mb-5 float-3d">
            <Icon name="piggy" size={32} />
          </div>
          <h2 className="text-[19px] font-extrabold mb-2">{t('app.name')}</h2>
          <p className="text-[14px] text-muted mb-6 max-w-sm mx-auto">{t('ins.noData')}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Btn onClick={() => setModal({ type: 'addAccount' })}>
              <Icon name="plus" size={16} /> {t('acc.addFirst')}
            </Btn>
            <Btn variant="secondary" onClick={() => setModal({ type: 'addTx' })}>{t('tx.addFirst')}</Btn>
          </div>
        </Card>
      </div>
    );
  }
  const hour = new Date().getHours();
  const greetKey = hour < 12 ? 'greet.morning' : hour < 18 ? 'greet.afternoon' : 'greet.evening';
  return (
    <div className="space-y-5 anim-rise">
      <div className="lg:hidden">
        <div className="text-[19px] font-extrabold leading-tight">
          {t(greetKey)}{state.profile.name ? ', ' + state.profile.name : ''}
        </div>
        <div className="text-[12px] text-muted mt-0.5">{fmtDateShort(today)}</div>
      </div>
      <Card className="p-5 sm:p-6 overflow-hidden relative hero-3d shine-sweep" data-tour="balance">
        <div className="absolute -top-24 -end-24 w-64 h-64 rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: 'var(--accent)' }} />
        
        <div className="relative">
          <div className="text-[12px] font-semibold text-muted mb-1">{t('dash.total')}</div>
          <div className="text-[34px] sm:text-[42px] font-extrabold num leading-none tracking-tight">{fmtMoney(totals.cash)}</div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 pt-5 border-t border-line">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-0.5">
                <Icon name="arrowDown" size={12} sw={2.6} className="text-accent" />
                {t('dash.income')} · {t('dash.thisMonth')}
              </div>
              <div className="text-[17px] font-bold num text-accent">{fmtMoney(thisM.income)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-0.5">
                <Icon name="arrowUp" size={12} sw={2.6} className="text-danger" />
                {t('dash.spent')} · {t('dash.thisMonth')}
              </div>
              <div className="text-[17px] font-bold num text-danger">{fmtMoney(thisM.expense)}</div>
            </div>
            <div className="ms-auto">
              <div className="text-[11px] font-semibold text-muted mb-0.5">{t('dash.networth')}</div>
              <div className="text-[17px] font-bold num">{fmtMoney(totals.netWorth)}</div>
            </div>
          </div>
        </div>
      </Card>
      {/* Surplus → Goals */}
      {state.goals.length > 0 && surplus > 0 && (
        <Card className="p-4 overflow-hidden relative tilt-3d shine-sweep" data-tour="surplus">
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-12 h-12 rounded-2xl bg-accentSoft text-accent grid place-items-center shrink-0 float-3d">
              <Icon name="sparkles" size={22} />
            </div>
            <div className="min-w-0 grow">
              <div className="text-[11.5px] font-semibold text-muted">{t('surplus.title')}</div>
              <div className="text-[22px] font-extrabold num leading-tight">{fmtMoney(surplus)}</div>
              <div className="text-[11px] text-muted mt-0.5">{t('surplus.tip')}</div>
            </div>
            <Btn onClick={() => setModal({ type: 'giveToGoal', payload: { surplus } })}
              className="shrink-0">
              <Icon name="target" size={15} sw={2.2} /> {t('surplus.giveToGoal')}
            </Btn>
          </div>
        </Card>
      )}
      <div className="flex gap-2 overflow-x-auto no-sb -mx-4 px-4 sm:mx-0 sm:px-0">
        <button onClick={() => setModal({ type: 'addTx' })}
          className="press shrink-0 h-11 px-4 rounded-xl bg-accent text-white dark:text-[#04150E] font-bold text-[13px] flex items-center gap-2 shadow-sm tilt-3d">
          <Icon name="plus" size={16} sw={2.4} /> {t('tx.add')}
        </button>
        {[50, 100, 250, 500].map((v) => (
          <button key={v} onClick={() => setModal({ type: 'addTx', payload: { type: 'expense', presetAmount: v } })}
            className="press shrink-0 h-11 px-4 rounded-xl bg-surface border border-line text-[13px] font-bold text-muted hover:text-ink transition num tilt-3d">
            +{v}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="overflow-hidden tilt-3d" data-tour="upcoming">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-[15px] font-bold">{t('dash.comingUp')}</h3>
              <button onClick={() => setPage('calendar')} className="press text-[12px] font-semibold text-accent">{t('dash.viewAll')}</button>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-5 pb-6 text-[13px] text-muted">{t('dash.noUpcoming')}</div>
            ) : (
              <div className="pb-2">
                {upcoming.slice(0, 5).map((u) => <UpcomingRow key={u.kind + u.id} item={u} />)}
              </div>
            )}
          </Card>
          {catData.length > 0 && (
            <Card className="p-5 tilt-3d">
              <h3 className="text-[15px] font-bold mb-4">{t('dash.byCategory')}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="float-3d"><Donut data={catData} size={170} thickness={22}
                  centerValue={fmtMoney(thisM.expense)} centerLabel={t('dash.thisMonth')} /></div>
                <div className="grow w-full space-y-2.5">
                  {catData.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-[13px] font-semibold truncate">{c.icon} {c.label}</span>
                      <span className="grow" />
                      <span className="text-[12.5px] font-bold num text-muted">{Math.round((c.value / thisM.expense) * 100)}%</span>
                      <span className="text-[12.5px] font-bold num w-20 text-end">{fmtMoney(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
          {insights.length > 0 && (
            <Card className="p-5 tilt-3d">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="sparkles" size={17} className="text-accent float-3d" />
                <h3 className="text-[15px] font-bold">{t('dash.insights')}</h3>
              </div>
              <div className="space-y-2.5">
                {insights.map((ins, i) => {
                  const tones = { good: 'bg-accentSoft text-accent', warn: 'bg-warnSoft text-warn', bad: 'bg-dangerSoft text-danger', info: 'bg-surface2 text-muted', neutral: 'bg-surface2 text-muted' };
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className={'w-8 h-8 rounded-xl grid place-items-center text-[14px] shrink-0 ' + tones[ins.tone]}><Icon name={ins.icon} size={14} sw={2} /></div>
                      <p className="text-[13.5px] leading-relaxed pt-1.5 text-ink">{ins.text}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          <Card className="p-5 tilt-3d">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold">{t('dash.yourGoals')}</h3>
              <button onClick={() => setPage('goals')} className="press text-[12px] font-semibold text-accent">{t('dash.viewAll')}</button>
            </div>
            {state.goals.length === 0 ? (
              <div className="text-[13px] text-muted">{t('goal.none')}</div>
            ) : (
              <div className="space-y-4">
                {state.goals.slice(0, 3).map((g) => {
                  const saved = goalSaved(g, state.transactions);
                  const pct = g.target > 0 ? (saved / g.target) * 100 : 0;
                  return (
                    <div key={g.id}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[15px]">{g.icon}</span>
                        <span className="text-[13.5px] font-semibold truncate">{g.name[lang]}</span>
                        <span className="grow" />
                        <span className="text-[12px] font-bold num text-muted">{Math.round(pct)}%</span>
                      </div>
                      <div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 6 }}>
                        <div className="h-full rounded-full" style={{ width: Math.min(100, pct) + '%', background: g.color }} />
                      </div>
                      <div className="text-[11px] text-muted mt-1 num">{fmtMoney(saved)} / {fmtMoney(g.target)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          <Card className="p-5 tilt-3d">
            <h3 className="text-[15px] font-bold mb-4">{t('nw.title')}</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted">{t('nw.assets')}</span>
                <span className="font-bold num text-accent">{fmtMoney(totals.assets)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted">{t('nw.liabilities')}</span>
                <span className="font-bold num text-danger">−{fmtMoney(totals.liabilities)}</span>
              </div>
              <div className="pt-2.5 mt-1 border-t border-line flex justify-between items-baseline">
                <span className="text-[13px] font-semibold">{t('nw.net')}</span>
                <span className="text-[19px] font-extrabold num">{fmtMoney(totals.netWorth)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
function UpcomingRow({ item }) {
  const { t, lang, fmtMoney } = useApp();
  const tones = { recurring: { bg: 'bg-accentSoft', fg: 'text-accent', icon: 'repeat' }, reminder: { bg: 'bg-warnSoft', fg: 'text-warn', icon: 'bell' }, debt: { bg: 'bg-dangerSoft', fg: 'text-danger', icon: 'users' } };
  const tn = tones[item.kind] || tones.reminder;
  let when;
  if (item.days < 0) when = <span className="text-danger font-semibold">{t('rem.overdue')}</span>;
  else if (item.days === 0) when = <span className="text-warn font-semibold">{t('rem.today')}</span>;
  else if (item.days === 1) when = <span className="text-warn font-semibold">{t('rem.tomorrow')}</span>;
  else when = <span className="text-muted">{t('rem.inDays', { n: item.days })}</span>;
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-surface2/60 transition">
      <div className={'w-9 h-9 rounded-xl grid place-items-center shrink-0 ' + tn.bg + ' ' + tn.fg}>
        <Icon name={tn.icon} size={16} />
      </div>
      <div className="min-w-0 grow">
        <div className="text-[13.5px] font-semibold truncate">{item.name[lang]}</div>
        <div className="text-[11.5px]">{when}</div>
      </div>
      <div className="text-[13.5px] font-bold num shrink-0">{fmtMoney(item.amount)}</div>
    </div>
  );
}