import { addDays, parseISO, daysBetween, sameMonth, todayISO, freqPerMonth } from './utils';
export const isLiabilityAcc = (a) => a.type === 'credit';
export function txEffectOnAccount(tx, accountId) {
  if (tx.type === 'income' && tx.accountId === accountId) return tx.amount;
  if (tx.type === 'expense' && tx.accountId === accountId) return -tx.amount;
  if (tx.type === 'goal' && tx.accountId === accountId) return -tx.amount;
  if (tx.type === 'transfer') {
    if (tx.accountId === accountId) return -tx.amount;
    if (tx.toAccountId === accountId) return tx.amount;
  }
  return 0;
}
export function accountBalance(acc, transactions) {
  let bal = Number(acc.initialBalance) || 0;
  for (const t of transactions) bal += txEffectOnAccount(t, acc.id);
  return bal;
}
export function goalSaved(goal, transactions) {
  let saved = Number(goal.initialSaved) || 0;
  for (const t of transactions) {
    if (t.type === 'goal' && t.goalId === goal.id) saved += t.amount;
  }
  return Math.max(0, saved);
}
export function computeBalances(accounts, transactions) {
  const map = {};
  for (const a of accounts) map[a.id] = accountBalance(a, transactions);
  return map;
}
export function computeTotals(state) {
  const { accounts, transactions, goals, debts } = state;
  const balances = computeBalances(accounts, transactions);
  let cash = 0, creditDebt = 0;
  for (const a of accounts) {
    const b = balances[a.id] || 0;
    if (isLiabilityAcc(a)) { if (b < 0) creditDebt += -b; else cash += b; }
    else { if (b >= 0) cash += b; else creditDebt += -b; }
  }
  const goalTotal = goals.reduce((s, g) => s + goalSaved(g, transactions), 0);
  let debtOwe = 0, debtOwed = 0;
  for (const d of debts) {
    const rem = Math.max(0, (Number(d.amount) || 0) - (Number(d.paid) || 0));
    if (d.kind === 'owe') debtOwe += rem; else debtOwed += rem;
  }
  const assets = cash + goalTotal + debtOwed;
  const liabilities = creditDebt + debtOwe;
  return { balances, cash, creditDebt, goalTotal, debtOwe, debtOwed, assets, liabilities, netWorth: assets - liabilities, liquidTotal: cash };
}
export function monthStats(state, refISO) {
  let income = 0, expense = 0;
  const byCat = {}, byAcc = {}, bySource = {}, byBudget = {};
  for (const t of state.transactions) {
    if (!sameMonth(t.date, refISO)) continue;
    if (t.type === 'income') {
      income += t.amount;
      const k = t.sourceId || t.categoryId || 'src_other';
      bySource[k] = (bySource[k] || 0) + t.amount;
    } else if (t.type === 'expense') {
      expense += t.amount;
      byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount;
      byAcc[t.accountId] = (byAcc[t.accountId] || 0) + t.amount;
      if (t.budgetId) {
        byBudget[t.budgetId] = (byBudget[t.budgetId] || 0) + t.amount;
      }
    }
  }
  return { income, expense, net: income - expense, byCat, byAcc, bySource, byBudget };
}
export function upcomingItems(state, days = 45) {
  const today = todayISO();
  const items = [];
  for (const r of state.recurring) {
    const d = daysBetween(today, r.nextDate);
    if (d <= days) items.push({ id: r.id, kind: 'recurring', name: r.name, amount: r.amount, date: r.nextDate, days: d, ref: r });
  }
  for (const r of state.reminders) {
    if (r.done) continue;
    const d = daysBetween(today, r.date);
    if (d <= days) items.push({ id: r.id, kind: 'reminder', name: r.name, amount: r.amount, date: r.date, days: d, ref: r });
  }
  for (const dbt of state.debts) {
    if (!dbt.dueDate) continue;
    const rem = Math.max(0, (Number(dbt.amount) || 0) - (Number(dbt.paid) || 0));
    if (rem <= 0) continue;
    const d = daysBetween(today, dbt.dueDate);
    if (d <= days) items.push({ id: dbt.id, kind: 'debt', name: dbt.person, amount: rem, date: dbt.dueDate, days: d, ref: dbt, debtKind: dbt.kind });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
export function installmentStats(inst) {
  const total = Number(inst.total) || 0;
  const monthly = Number(inst.monthly) || (inst.count > 0 ? total / inst.count : 0);
  const paidCount = Math.max(0, Math.min(Number(inst.paidCount) || 0, inst.count));
  const remainingCount = Math.max(0, inst.count - paidCount);
  const paidAmount = monthly * paidCount;
  const remainingAmount = Math.max(0, total - paidAmount);
  const progress = total > 0 ? (paidAmount / total) * 100 : 0;
  const [y, m, day] = (inst.startDate || todayISO()).split('-').map(Number);
  const next = new Date(y, (m - 1) + paidCount, day);
  return { total, monthly, paidCount, remainingCount, paidAmount, remainingAmount, progress, nextDate: todayISO(next) };
}
export function generateInsights(state, lang, fmtMoney, t) {
  const out = [];
  const today = todayISO();
  const thisM = monthStats(state, today);
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const lastM = monthStats(state, todayISO(d));
  if (state.transactions.length === 0) {
    out.push({ tone: 'info', icon: 'sparkles', text: t('ins.noData') });
    return out;
  }
  if (lastM.expense > 0) {
    const change = ((thisM.expense - lastM.expense) / lastM.expense) * 100;
    if (change >= 5) out.push({ tone: 'warn', icon: 'trendUp', text: t('ins.spentMore', { p: Math.round(change) }) });
    else if (change <= -5) out.push({ tone: 'good', icon: 'trendDown', text: t('ins.spentLess', { p: Math.round(Math.abs(change)) }) });
  }
  const catEntries = Object.entries(thisM.byCat).sort((a, b) => b[1] - a[1]);
  if (catEntries.length && thisM.expense > 0) {
    const [cid, amt] = catEntries[0];
    const cat = state.categories.find((c) => c.id === cid);
    if (cat) out.push({ tone: 'neutral', icon: cat.icon, text: t('ins.topCat', { cat: cat[lang], p: Math.round((amt / thisM.expense) * 100) }) });
  }
  if (thisM.income > 0) {
    const rate = ((thisM.income - thisM.expense) / thisM.income) * 100;
    if (rate > 0) out.push({ tone: 'good', icon: 'coins', text: t('ins.savingsRate', { p: Math.round(rate) }) });
    else if (rate < 0) out.push({ tone: 'bad', icon: 'alertTri', text: t('ins.negativeRate', { amt: fmtMoney(Math.abs(thisM.income - thisM.expense)) }) });
  }
  for (const b of state.budgets) {
    const spent = thisM.byCat[b.categoryId] || 0;
    const p = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const cat = state.categories.find((c) => c.id === b.categoryId);
    if (!cat) continue;
    if (p >= 100) out.push({ tone: 'bad', icon: 'alertTri', text: t('ins.budgetOver', { cat: cat[lang], amt: fmtMoney(spent - b.amount) }) });
    else if (p >= 80) out.push({ tone: 'warn', icon: 'clock', text: t('ins.budgetWarn', { cat: cat[lang], p: Math.round(p) }) });
  }
  const up = upcomingItems(state, 14).filter((i) => i.days >= 0);
  const upTotal = up.reduce((s, i) => s + i.amount, 0);
  if (upTotal > 0) out.push({ tone: 'info', icon: 'bell', text: t('ins.upcoming', { amt: fmtMoney(upTotal) }) });
  for (const g of state.goals) {
    const saved = goalSaved(g, state.transactions);
    const pct = g.target > 0 ? (saved / g.target) * 100 : 0;
    if (pct >= 80 && pct < 100) {
      out.push({ tone: 'good', icon: 'target', text: t('ins.goalClose', { name: g.name[lang], amt: fmtMoney(g.target - saved) }) });
      break;
    }
  }
  if (out.length === 0) out.push({ tone: 'good', icon: 'thumbsUp', text: t('ins.good') });
  return out.slice(0, 5);
}
export function generateNotifications(state, lang, fmtMoney, t) {
  const today = todayISO();
  const out = [];
  const up = upcomingItems(state, 7);
  for (const i of up) {
    const name = i.name[lang];
    if (i.days < 0) out.push({ id: 'ov_' + i.id, icon: 'alertTri', tone: 'bad', text: t('notif.overdue', { name, amt: fmtMoney(i.amount) }) });
    else if (i.days === 0) out.push({ id: 'td_' + i.id, icon: 'bell', tone: 'warn', text: t('notif.dueToday', { name, amt: fmtMoney(i.amount) }) });
    else if (i.days === 1) out.push({ id: 't1_' + i.id, icon: 'bell', tone: 'warn', text: t('notif.due1', { name, amt: fmtMoney(i.amount) }) });
    else if (i.days <= 3) out.push({ id: 'd3_' + i.id, icon: 'bell', tone: 'info', text: t('notif.due3', { name, amt: fmtMoney(i.amount) }) });
  }
  const thisM = monthStats(state, today);
  for (const b of state.budgets) {
    const spent = thisM.byCat[b.categoryId] || 0;
    const p = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const cat = state.categories.find((c) => c.id === b.categoryId);
    if (!cat) continue;
    if (p >= 100) out.push({ id: 'b100_' + b.id, icon: 'alertTri', tone: 'bad', text: t('notif.budget100', { name: cat[lang] }) });
    else if (p >= 80) out.push({ id: 'b80_' + b.id, icon: 'clock', tone: 'warn', text: t('notif.budget80', { name: cat[lang] }) });
  }
  for (const g of state.goals) {
    const saved = goalSaved(g, state.transactions);
    const pct = g.target > 0 ? (saved / g.target) * 100 : 0;
    if (pct >= 100) out.push({ id: 'g100_' + g.id, icon: 'sparkles', tone: 'good', text: t('notif.goal100', { name: g.name[lang] }) });
    else if (pct >= 50 && pct < 55) out.push({ id: 'g50_' + g.id, icon: 'target', tone: 'good', text: t('notif.goal50', { name: g.name[lang] }) });
  }
  return out.filter((n) => !(state.dismissedNotifs || []).includes(n.id));
}
export function checkGoalMilestone(goal, beforeSaved, afterSaved) {
  const thresholds = [25, 50, 75, 100];
  const before = (beforeSaved / goal.target) * 100;
  const after = (afterSaved / goal.target) * 100;
  for (const th of thresholds) if (before < th && after >= th) return th;
  return null;
}
export function extractDateFromText(raw) {
  if (!raw) return null;
  const today = todayISO();
  const lower = raw.toLowerCase();
  if (/(بعد\s*بكره|بعد\s*غد|day\s*after\s*tomorrow)/i.test(raw)) return addDays(today, 2);
  if (/(بكره|غدا|غدًا|tomorrow)/i.test(raw)) return addDays(today, 1);
  if (/(امبارح|أمس|yesterday)/i.test(raw)) return addDays(today, -1);
  if (/(النهارده|اليوم|today)/i.test(raw)) return today;
  const agoMatch = raw.match(/(?:من|قبل)\s*(\d+)\s*(?:يوم|أيام|days?)/i) ||
                   raw.match(/(\d+)\s*(?:days?|يوم|أيام)\s*(?:مضت|فات|ago|قبل)/i);
  if (agoMatch) return addDays(today, -parseInt(agoMatch[1], 10));
  const dayMap = [
    { keys: ['السبت', 'saturday'], day: 6 },
    { keys: ['الأحد', 'الاحد', 'sunday'], day: 0 },
    { keys: ['الاتنين', 'الاثنين', 'monday'], day: 1 },
    { keys: ['التلات', 'الثلاثاء', 'tuesday'], day: 2 },
    { keys: ['الأربع', 'الاربعاء', 'wednesday'], day: 3 },
    { keys: ['الخميس', 'thursday'], day: 4 },
    { keys: ['الجمعة', 'جمعه', 'friday'], day: 5 },
  ];
  for (const { keys, day } of dayMap) {
    if (keys.some((k) => lower.includes(k))) {
      const current = parseISO(today).getDay();
      let diff = day - current;
      if (diff >= 0) diff -= 7;
      return addDays(today, diff);
    }
  }
  return null;
}
export function parseNatural(text, state, lang) {
  const raw = (text || '').trim();
  if (!raw) return null;
  let type = 'expense';
  if (/(دخل|قبضت|استلمت|income|received|salary|راتب)/i.test(raw)) type = 'income';
  if (/(حولت|transfer|نقلت)/i.test(raw)) type = 'transfer';
  const amtMatch = raw.match(/(\d+(?:[.,]\d{1,2})?)/);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(',', '')) : 0;
  const lower = raw.toLowerCase();
  const rules = [
    { kw: ['أكل','اكل','مطعم','فطار','غدا','عشا','قهوة','coffee','restaurant','lunch','dinner','supermarket','سوبر','كارفور'], cat: 'cat_food' },
    { kw: ['مواصلات','أوبر','اوبر','كريم','تاكسي','بنزين','باص','مترو','uber','careem','taxi','fuel','petrol','metro'], cat: 'cat_trans' },
    { kw: ['مشتريات','هدوم','ملابس','أمازون','نون','mall','مول','shopping','amazon','noon','clothes'], cat: 'cat_shop' },
    { kw: ['فاتورة','كهربا','غاز','مية','نت','إنترنت','إيجار','bill','rent','internet'], cat: 'cat_bills' },
    { kw: ['سينما','فيلم','خروجة','لعبة','game','cinema','movie'], cat: 'cat_ent' },
    { kw: ['صيدلية','دكتور','دوا','مستشفى','pharmacy','doctor','medicine','hospital'], cat: 'cat_health' },
    { kw: ['كورس','كتاب','تعليم','course','book','udemy'], cat: 'cat_edu' },
    { kw: ['اشتراك','نتفليكس','سبوتيفاي','netflix','spotify','subscription'], cat: 'cat_subs' },
    { kw: ['سفر','طيران','فندق','تذكرة','travel','flight','hotel','ticket'], cat: 'cat_travel' },
  ];
  let categoryId = null;
  for (const r of rules) if (r.kw.some((k) => lower.includes(k))) { categoryId = r.cat; break; }
  let accountId = null;
  for (const a of state.accounts) {
    const names = [a.name.ar, a.name.en].filter(Boolean).map((s) => s.toLowerCase());
    if (names.some((n) => n && lower.includes(n.split(' ')[0]))) { accountId = a.id; break; }
  }
  if (!accountId) {
    if (/(كاش|cash)/i.test(raw)) { const c = state.accounts.find((a) => a.type === 'cash'); if (c) accountId = c.id; }
    else if (/(فيزا|visa|كريدت|credit)/i.test(raw)) { const c = state.accounts.find((a) => a.type === 'credit'); if (c) accountId = c.id; }
    else if (/(بنك|bank)/i.test(raw)) { const c = state.accounts.find((a) => a.type === 'bank'); if (c) accountId = c.id; }
  }
  if (!accountId) accountId = state.accounts[0]?.id || null;
  const date = extractDateFromText(raw);
  return { type, amount, categoryId, accountId, date, raw };
}export function getSurplus(state, refISO) {
  const ref = refISO || todayISO();
  const m = monthStats(state, ref);
  const toGoals = state.transactions
    .filter((t) => t.type === 'goal' && t.amount > 0 && sameMonth(t.date, ref))
    .reduce((s, t) => s + t.amount, 0);
  return Math.max(0, m.income - m.expense - toGoals);
}
export function generateCategorizedInsights(state, lang, fmtMoney, t) {
  const today = todayISO();
  const thisM = monthStats(state, today);
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const lastM = monthStats(state, todayISO(d));
  const out = { savings: [], spending: [], warnings: [], goals: [], credit: [], upcoming: [] };
  // ═══ Savings ═══
  if (thisM.income > 0) {
    const rate = ((thisM.income - thisM.expense) / thisM.income) * 100;
    if (rate >= 20) out.savings.push({ tone: 'good', icon: 'coins', text: t('ins.tip.savingsGood', { p: Math.round(rate) }) });
    else if (rate > 0) out.savings.push({ tone: 'warn', icon: 'coins', text: t('ins.tip.savingsLow', { p: Math.round(rate) }) });
    else out.savings.push({ tone: 'bad', icon: 'alertTri', text: t('ins.tip.savingsNeg', { amt: fmtMoney(Math.abs(thisM.income - thisM.expense)) }) });
  }
  // ═══ Spending ═══
  if (lastM.expense > 0) {
    const change = ((thisM.expense - lastM.expense) / lastM.expense) * 100;
    if (change >= 5) out.spending.push({ tone: 'warn', icon: 'trendUp', text: t('ins.tip.spendUp', { p: Math.round(change) }) });
    else if (change <= -5) out.spending.push({ tone: 'good', icon: 'trendDown', text: t('ins.tip.spendDown', { p: Math.round(Math.abs(change)) }) });
  }
  const catEntries = Object.entries(thisM.byCat).sort((a, b) => b[1] - a[1]);
  if (catEntries.length && thisM.expense > 0) {
    const [cid, amt] = catEntries[0];
    const cat = state.categories.find((c) => c.id === cid);
    if (cat) out.spending.push({ tone: 'neutral', icon: cat.icon, text: t('ins.tip.topCat', { cat: cat[lang], p: Math.round((amt / thisM.expense) * 100), amt: fmtMoney(amt) }) });
  }
  const catCounts = {};
  for (const tx of state.transactions) {
    if (tx.type !== 'expense' || !sameMonth(tx.date, today)) continue;
    catCounts[tx.categoryId] = (catCounts[tx.categoryId] || 0) + 1;
  }
  const frequent = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  if (frequent && frequent[1] >= 3) {
    const cat = state.categories.find((c) => c.id === frequent[0]);
    if (cat) out.spending.push({ tone: 'neutral', icon: cat.icon, text: t('ins.tip.frequent', { cat: cat[lang], n: frequent[1] }) });
  }
  // ═══ Warnings ═══
  for (const b of state.budgets) {
    const spent = thisM.byCat[b.categoryId] || 0;
    const p = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const cat = state.categories.find((c) => c.id === b.categoryId);
    if (!cat) continue;
    if (p >= 100) out.warnings.push({ tone: 'bad', icon: 'alertTri', text: t('ins.tip.budgetOver', { cat: cat[lang], amt: fmtMoney(spent - b.amount) }) });
    else if (p >= 80) out.warnings.push({ tone: 'warn', icon: 'clock', text: t('ins.tip.budgetWarn', { cat: cat[lang], p: Math.round(p) }) });
  }
  const totalOwe = state.debts.filter((x) => x.kind === 'owe').reduce((s, x) => s + Math.max(0, (x.amount || 0) - (x.paid || 0)), 0);
  if (totalOwe > 0) out.warnings.push({ tone: 'warn', icon: 'users', text: t('ins.tip.debtOwe', { amt: fmtMoney(totalOwe) }) });
  // ═══ Goals ═══
  for (const g of state.goals) {
    const saved = goalSaved(g, state.transactions);
    const pct = g.target > 0 ? (saved / g.target) * 100 : 0;
    const remaining = Math.max(0, g.target - saved);
    if (pct >= 100) {
      out.goals.push({ tone: 'good', icon: 'sparkles', text: t('ins.tip.goalDone', { name: g.name[lang] }) });
    } else if (pct >= 80) {
      out.goals.push({ tone: 'good', icon: 'target', text: t('ins.tip.goalClose', { name: g.name[lang], amt: fmtMoney(remaining) }) });
    } else if (g.deadline && remaining > 0) {
      const days = daysBetween(today, g.deadline);
      const months = Math.max(1, Math.ceil(days / 30.44));
      out.goals.push({ tone: 'info', icon: 'calendar', text: t('ins.tip.goalPerMonth', { name: g.name[lang], amt: fmtMoney(remaining / months, { decimals: 0 }) }) });
    } else if (pct > 0) {
      out.goals.push({ tone: 'neutral', icon: g.icon || '', text: t('ins.tip.goalPct', { name: g.name[lang], p: Math.round(pct) }) });
    }
  }
  // ═══ Credit ═══
  const creditAccs = state.accounts.filter((a) => a.type === 'credit');
  const totalCreditDebt = creditAccs.reduce((s, a) => {
    const bal = computeBalances([a], state.transactions)[a.id] || 0;
    return s + Math.max(0, -bal);
  }, 0);
  if (totalCreditDebt > 0) {
    const totalAssets = state.accounts.filter((a) => a.type !== 'credit').reduce((s, a) => s + Math.max(0, computeBalances([a], state.transactions)[a.id] || 0), 0);
    const usage = totalAssets + totalCreditDebt > 0 ? (totalCreditDebt / (totalAssets + totalCreditDebt)) * 100 : 0;
    if (usage >= 30) out.credit.push({ tone: 'warn', icon: '', text: t('ins.tip.creditUsage', { p: Math.round(usage) }) });
    out.credit.push({ tone: 'info', icon: 'bank', text: t('ins.tip.creditHigh', { amt: fmtMoney(totalCreditDebt) }) });
  }
  const totalOwed = state.debts.filter((x) => x.kind === 'owed').reduce((s, x) => s + Math.max(0, (x.amount || 0) - (x.paid || 0)), 0);
  if (totalOwed > 0) out.credit.push({ tone: 'info', icon: 'download', text: t('ins.tip.debtOwed', { amt: fmtMoney(totalOwed) }) });
  // ═══ Upcoming ═══
  const up = upcomingItems(state, 14);
  const upTotal = up.filter((i) => i.days >= 0).reduce((s, i) => s + i.amount, 0);
  const upToday = up.filter((i) => i.days === 0).length;
  const upOverdue = up.filter((i) => i.days < 0).length;
  if (upOverdue > 0) out.upcoming.push({ tone: 'bad', icon: 'alertTri', text: t('ins.tip.upcomingOverdue', { n: upOverdue }) });
  if (upToday > 0) out.upcoming.push({ tone: 'warn', icon: 'bell', text: t('ins.tip.upcomingToday', { n: upToday }) });
  if (upTotal > 0) out.upcoming.push({ tone: 'info', icon: 'calendar', text: t('ins.tip.upcomingTotal', { amt: fmtMoney(upTotal) }) });
  const recMonthly = state.recurring.reduce((s, r) => s + r.amount * freqPerMonth(r.frequency), 0);
  if (recMonthly > 0) out.upcoming.push({ tone: 'neutral', icon: 'repeat', text: t('ins.tip.recurringLoad', { amt: fmtMoney(recMonthly) }) });
  return out;
}
export function budgetSpent(budget, transactions, refISO) {
  if (!budget) return 0;
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (refISO && !sameMonth(tx.date, refISO)) continue;
    if (tx.budgetId) {
      // معاملة مربوطة بميزانية صراحةً
      if (tx.budgetId === budget.id) total += tx.amount;
      continue;
    }
    // fallback — اربطها بتصنيف الميزانية
    if (budget.categoryId && tx.categoryId === budget.categoryId) {
      total += tx.amount;
    }
  }
  return total;
}
export function ensureGeneralBudget(state) {
  const existing = (state.budgets || []).find((b) => b.isGeneral);
  if (existing) return existing;
  const newBudget = {
    id: 'bud_general_' + Math.random().toString(36).slice(2, 8),
    categoryId: null,
    isGeneral: true,
    amount: 0,
  };
  return newBudget;
}// ══════════════════════════════════════════════════════════════
// CUSTODY (أمانات)
// ══════════════════════════════════════════════════════════════
export function custodyStats(custody, custodyTransactions) {
  const txns = (custodyTransactions || []).filter((t) => t.custodyId === custody.id);
  let withdrawn = 0;
  let returned = 0;
  for (const t of txns) {
    if (t.type === 'withdraw') withdrawn += Number(t.amount) || 0;
    else if (t.type === 'return') returned += Number(t.amount) || 0;
  }
  const original = Number(custody.amount) || 0;
  const balance = original - withdrawn + returned;
  const progress = original > 0 ? Math.min(100, Math.max(0, (returned / original) * 100)) : 0;
  const netWithdrawn = Math.max(0, withdrawn - returned);
  return {
    original,
    withdrawn,
    returned,
    balance: Math.max(0, balance),
    netWithdrawn,
    progress,
    transactions: txns.sort((a, b) => b.date.localeCompare(a.date)),
    count: txns.length,
  };
}
export function custodyTotals(state) {
  const list = state.custodies || [];
  let totalHeld = 0;
  let totalOriginal = 0;
  let totalWithdrawn = 0;
  let totalReturned = 0;
  for (const c of list) {
    const st = custodyStats(c, state.custodyTransactions || []);
    if (!c.closed) totalHeld += st.balance;
    totalOriginal += st.original;
    totalWithdrawn += st.withdrawn;
    totalReturned += st.returned;
  }
  return { totalHeld, totalOriginal, totalWithdrawn, totalReturned };
}
export function activeCustodies(state) {
  return (state.custodies || []).filter((c) => !c.closed);
}