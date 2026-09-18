import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, EmptyState, Segmented } from '../components/ui';
import { Donut, BarChart, LineChart } from '../components/charts';
import { todayISO, addDays, daysBetween } from '../lib/utils';
export function AnalyticsPage() {
const { state, t, lang, fmtMoney } = useApp();
const [range, setRange] = useState('month');
const now = todayISO();
const startDate = useMemo(() => {
if (range === 'week') return addDays(now, -7);
if (range === 'month') return now.slice(0, 8) + '01';
if (range === 'year') return now.slice(0, 4) + '-01-01';
return addDays(now, -30);
}, [range, now]);
const data = useMemo(() => {
const inRange = state.transactions.filter((x) => x.date >= startDate && x.date <= now);
let income = 0, expense = 0;
const byCat = {}, byAcc = {}, bySource = {}, daily = {};
for (const x of inRange) {
if (x.type === 'income') {
income += x.amount;
const k = x.sourceId || x.categoryId || 'src_other';
bySource[k] = (bySource[k] || 0) + x.amount;
} else if (x.type === 'expense') {
expense += x.amount;
byCat[x.categoryId] = (byCat[x.categoryId] || 0) + x.amount;
byAcc[x.accountId] = (byAcc[x.accountId] || 0) + x.amount;
daily[x.date] = (daily[x.date] || 0) + x.amount;
}
}
const days = Math.max(1, daysBetween(startDate, now) + 1);
const months = [];
const d = new Date();
for (let i = 5; i >= 0; i--) {
const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
const key = todayISO(dt).slice(0, 7);
let exp = 0;
for (const x of state.transactions) {
if (!x.date.startsWith(key)) continue;
if (x.type === 'expense') exp += x.amount;
}
months.push({ label: dt.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'short' }), expense: exp });
}
const line = [];
for (let i = 29; i >= 0; i--) line.push({ value: daily[addDays(now, -i)] || 0 });
return { income, expense, net: income - expense, byCat, byAcc, bySource, days, months, line };
}, [state.transactions, startDate, now, lang]);
const catData = Object.entries(data.byCat).map(([cid, v]) => {
const c = state.categories.find((x) => x.id === cid);
return c ? { label: c[lang], value: v, color: c.color, icon: c.icon } : null;
}).filter(Boolean).sort((a, b) => b.value - a.value);
const accData = Object.entries(data.byAcc).map(([aid, v]) => {
const a = state.accounts.find((x) => x.id === aid);
return a ? { label: a.name[lang], value: v, color: a.color } : null;
}).filter(Boolean).sort((a, b) => b.value - a.value);
const srcData = Object.entries(data.bySource).map(([sid, v]) => {
const s = state.categories.find((x) => x.id === sid);
return s ? { label: s[lang], value: v, icon: s.icon } : null;
}).filter(Boolean).sort((a, b) => b.value - a.value);
const hasData = state.transactions.length > 0;
const StatCard = ({ label, value, tone = 'neutral' }) => {
const tones = { good: 'text-accent', bad: 'text-danger', neutral: 'text-ink' };
return (
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1.5">{label}</div>
<div className={'text-[18px] sm:text-[20px] font-extrabold num ' + tones[tone]}>{value}</div>
</Card>
);
};
return (
<div className="space-y-5 anim-rise">
<div className="flex items-center gap-3 flex-wrap">
<h1 className="text-[22px] font-extrabold">{t('an.title')}</h1>
<div className="grow" />
<Segmented value={range} onChange={setRange}
options={[
{ value: 'week', label: t('common.week') },
{ value: 'month', label: t('common.month') },
{ value: 'year', label: t('common.year') },
]} />
</div>
{!hasData ? (
<EmptyState icon="��" title={t('an.none')} />
) : (
<>
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
<StatCard label={t('an.totalIncome')} value={fmtMoney(data.income)} tone="good" />
<StatCard label={t('an.totalExpense')} value={fmtMoney(data.expense)} tone="bad" />
<StatCard label={t('an.netFlow')} value={fmtMoney(data.net)} tone={data.net >= 0 ? 'good' : 'bad'} />
<StatCard label={t('an.avgDaily')} value={fmtMoney(data.expense / data.days)} />
</div>
<Card className="p-5">
<h3 className="text-[15px] font-bold mb-4">{t('an.last6')}</h3>
<BarChart data={data.months.map((m) => ({ label: m.label, value: m.expense, color: 'var(--danger)' }))} height={150} formatValue={(v) => fmtMoney(v)} />
</Card>
<Card className="p-5">
<h3 className="text-[15px] font-bold mb-1">{t('an.last30')}</h3>
<LineChart points={data.line} height={150} />
</Card>
{catData.length > 0 && (
<Card className="p-5">
<h3 className="text-[15px] font-bold mb-4">{t('an.byCategory')}</h3>
<div className="flex flex-col sm:flex-row items-center gap-7">
<Donut data={catData} size={180} thickness={24} centerValue={fmtMoney(data.expense)} centerLabel={t('an.totalExpense')} />
<div className="grow w-full space-y-3">
{catData.map((c, i) => (
<div key={i}>
<div className="flex items-center gap-2.5 mb-1">
<span className="text-[14px]">{c.icon}</span>
<span className="text-[13px] font-semibold truncate">{c.label}</span>
<span className="grow" />
<span className="text-[12px] font-bold num">{fmtMoney(c.value)}</span>
<span className="text-[11px] text-muted num w-10 text-end">{Math.round((c.value / data.expense) * 100)}%</span>
</div>
<div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 4 }}>
<div className="h-full rounded-full" style={{ width: (c.value / data.expense) * 100 + '%', background: c.color }} />
</div>
</div>
))}
</div>
</div>
</Card>
)}
{accData.length > 0 && (
<Card className="p-5">
<h3 className="text-[15px] font-bold mb-4">{t('an.byAccount')}</h3>
<div className="space-y-3">
{accData.map((a, i) => (
<div key={i}>
<div className="flex items-center gap-2.5 mb-1">
<span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
<span className="text-[13px] font-semibold truncate">{a.label}</span>
<span className="grow" />
<span className="text-[12.5px] font-bold num">{fmtMoney(a.value)}</span>
</div>
<div className="w-full rounded-full bg-surface2 overflow-hidden" style={{ height: 4 }}>
<div className="h-full rounded-full" style={{ width: (a.value / data.expense) * 100 + '%', background: a.color }} />
</div>
</div>
))}
</div>
</Card>
)}
{srcData.length > 0 && (
<Card className="p-5">
<h3 className="text-[15px] font-bold mb-4">{t('an.bySource')}</h3>
<div className="space-y-3">
{srcData.map((s, i) => (
<div key={i} className="flex items-center gap-3">
<span className="text-[15px]">{s.icon || ''}</span>
<span className="text-[13px] font-semibold grow truncate">{s.label}</span>
<span className="text-[12.5px] font-bold num">{fmtMoney(s.value)}</span>
</div>
))}
</div>
</Card>
)}
</>
)}
</div>
);
}