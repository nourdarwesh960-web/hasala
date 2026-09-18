/* ══════════════════════════════════════════════════════════════════
   CHAT PERSONAL — يجيب على أسئلة عن حساب المستخدم
   ══════════════════════════════════════════════════════════════════ */
import {
  computeTotals,
  monthStats,
  goalSaved,
  upcomingItems,
  installmentStats,
  accountBalance,
} from './finance';
import { todayISO, daysBetween, monthKey, fmtNum } from './utils';
// ─── تطبيع عربي مبسّط ───
function nrm(t) {
  if (!t) return '';
  let s = String(t).toLowerCase().trim();
  s = s.replace(/[\u064B-\u065F\u0670]/g, '');
  s = s.replace(/[أإآٱا]/g, 'ا');
  s = s.replace(/[ىي]/g, 'ي');
  s = s.replace(/[ةه]/g, 'ه');
  s = s.replace(/[ؤئ]/g, 'ء').replace(/ء/g, '');
  s = s.replace(/اد ايه|اد اي|قد ايه|قد اي|كام/g, 'كام');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
// ─── تطبيع اسم (بدون تحويل الهاء/الياء عشان الأسماء) ───
function nrmName(t) {
  if (!t) return '';
  return String(t).toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
// ─── تنسيق مبلغ ───
function money(n, lang, fmtMoney) {
  return fmtMoney ? fmtMoney(n) : (fmtNum(n) + (lang === 'ar' ? ' ج.م' : ' EGP'));
}
// ─── اختبارات النية (query test) ───
const QUERIES = [
  // ═══════════ إجمالي اللي حوشته ═══════════
  {
    id: 'total_saved',
    test: (n) => /(حوشت|وفّرت|وفرت|جمعت|مدخراتي|saved|i.*saved)/.test(n) && !/(هدف|goal|نسبه|rate)/.test(n),
    answer: (s, l, f) => {
      const total = (s.goals || []).reduce((sum, g) => sum + goalSaved(g, s.transactions), 0);
      const perGoal = (s.goals || []).map((g) => {
        const saved = goalSaved(g, s.transactions);
        return `• ${g.name[l]}: ${money(saved, l, f)}`;
      });
      return {
        text: l === 'ar'
          ? `💰 إجمالي اللي حوشته: ${money(total, l, f)}\n\n${perGoal.length ? perGoal.join('\n') : 'مفيش أهداف لسه.'}`
          : `💰 Total saved: ${money(total, l, f)}\n\n${perGoal.length ? perGoal.join('\n') : 'No goals yet.'}`,
        suggestions: l === 'ar' ? ['أهدافي', 'الهدف وصل لفين؟'] : ['My goals', 'Goal progress'],
      };
    },
  },
  // ═══════════ الصافي (صافي الفلوس) ═══════════
  {
    id: 'cash_balance',
    test: (n) => /(صافي|الخالص|الفاضي|باقي|net cash|leftover)/.test(n) && !/(ثروه|net ?worth)/.test(n),
    answer: (s, l, f) => {
      const t = computeTotals(s);
      const m = monthStats(s, todayISO());
      const net = m.income - m.expense;
      return {
        text: l === 'ar'
          ? `💰 الكاش المتاح عندك: ${money(t.cash, l, f)}\n\nالشهر ده:\n• دخل: ${money(m.income, l, f)}\n• صرف: ${money(m.expense, l, f)}\n• ${net >= 0 ? 'صافي' : 'زيادة صرف'}: ${money(Math.abs(net), l, f)}`
          : `💰 Available cash: ${money(t.cash, l, f)}\n\nThis month:\n• Income: ${money(m.income, l, f)}\n• Spent: ${money(m.expense, l, f)}\n• ${net >= 0 ? 'Net' : 'Over'}: ${money(Math.abs(net), l, f)}`,
        suggestions: l === 'ar' ? ['صافي ثروتي', 'صرفت على إيه؟'] : ['Net worth', 'Top spending'],
      };
    },
  },
  // ═══════════ الرصيد ═══════════
  {
    id: 'balance',
    test: (n) => /^(معايا|رصيدي|فلوسي|الفلوس|الكاش)\s*(كام|فين)?\s*\??$/.test(n)
      || /(how much (do i have|money|is my balance)|my balance|what.*balance)/.test(n),
    answer: (s, l, f) => {
      const t = computeTotals(s);
      const lines = l === 'ar'
        ? [
            `معاك ${money(t.cash, l, f)}`,
            ``,
            `📊 التفاصيل:`,
            `• الكاش المتاح: ${money(t.cash, l, f)}`,
            `• الكريدت اللي عليك: ${money(t.creditDebt, l, f)}`,
            `• صافي ثروتك: ${money(t.netWorth, l, f)}`,
          ]
        : [
            `You have ${money(t.cash, l, f)}`,
            ``,
            `📊 Details:`,
            `• Available cash: ${money(t.cash, l, f)}`,
            `• Credit owed: ${money(t.creditDebt, l, f)}`,
            `• Net worth: ${money(t.netWorth, l, f)}`,
          ];
      return { text: lines.join('\n'), suggestions: l === 'ar' ? ['فلوسي فين؟', 'صافي ثروتي', 'عليا كام؟'] : ['Where is my money?', 'Net worth?', 'What do I owe?'] };
    },
  },
  // ═══════════ صافي الثروة ═══════════
  {
    id: 'networth',
    test: (n) => /(صافي|net ?worth|ثروتي|ثروت|networth)/.test(n),
    answer: (s, l, f) => {
      const t = computeTotals(s);
      return {
        text: l === 'ar'
          ? `💰 صافي ثروتك: ${money(t.netWorth, l, f)}\n\n🟢 أصول: ${money(t.assets, l, f)}\n🔴 التزامات: ${money(t.liabilities, l, f)}\n\nصافي الثروة = الأصول − الالتزامات`
          : `💰 Net worth: ${money(t.netWorth, l, f)}\n\n🟢 Assets: ${money(t.assets, l, f)}\n🔴 Liabilities: ${money(t.liabilities, l, f)}\n\nNet worth = assets − liabilities`,
        suggestions: l === 'ar' ? ['فلوسي فين؟', 'عليا كام؟', 'أهدافي'] : ['Where is my money?', 'What do I owe?', 'My goals'],
      };
    },
  },
  // ═══════════ قائمة الحسابات ═══════════
  {
    id: 'accounts_list',
    test: (n) => /(حساباتي|حسابات|الحسابات|قائمه الحسابات|my accounts|list.*account)/.test(n) && !/(رصيد|باقي|كام)/.test(n),
    answer: (s, l, f) => {
      if (!s.accounts.length) return { text: l === 'ar' ? 'لسه مفيش حسابات. ضيف حسابك الأول.' : 'No accounts yet. Add one first.' };
      const lines = s.accounts.map((a) => {
        const bal = accountBalance(a, s.transactions);
        return `• ${a.name[l]}: ${money(bal, l, f)}`;
      });
      return {
        text: (l === 'ar' ? 'حساباتك:' : 'Your accounts:') + '\n\n' + lines.join('\n'),
        suggestions: l === 'ar' ? ['معايا كام؟', 'صافي ثروتي'] : ['My balance?', 'Net worth'],
      };
    },
  },
  // ═══════════ رصيد حساب معين ═══════════
  {
    id: 'account_balance',
    test: (n) => /رصيد\s+\S+|رصيد\s+حساب\s+\S+|balance (of|in)\s+\S+/i.test(n) || /كام\s+في\s+\S+/i.test(n),
    answer: (s, l, f, text) => {
      const n = nrm(text);
      for (const a of s.accounts) {
        const names = [a.name.ar, a.name.en].filter(Boolean).map(nrmName);
        if (names.some((nm) => n.includes(nm))) {
          const bal = accountBalance(a, s.transactions);
          return {
            text: l === 'ar'
              ? `رصيد ${a.name[l]}: ${money(bal, l, f)}`
              : `${a.name[l]} balance: ${money(bal, l, f)}`,
            suggestions: l === 'ar' ? ['فلوسي فين؟', 'معايا كام؟'] : ['Where is my money?', 'Total?'],
          };
        }
      }
      return null; // ما لقيناش الحساب، نكمل في محرك تاني
    },
  },
  // ═══════════ ملخص الشهر ═══════════
  {
    id: 'month_summary',
    test: (n) => /(ملخص|summary|شهر ده|الشهر ده|this month|ملخص الشهر)/.test(n),
    answer: (s, l, f) => {
      const t = todayISO();
      const m = monthStats(s, t);
      const net = m.income - m.expense;
      return {
        text: l === 'ar'
          ? `📊 ملخص الشهر:\n\n💰 دخل: ${money(m.income, l, f)}\n💸 صرف: ${money(m.expense, l, f)}\n${net >= 0 ? '✅ صافي' : '⚠️ زيادة'}: ${money(Math.abs(net), l, f)}`
          : `📊 This month:\n\n💰 Income: ${money(m.income, l, f)}\n💸 Spent: ${money(m.expense, l, f)}\n${net >= 0 ? '✅ Net' : '⚠️ Over'}: ${money(Math.abs(net), l, f)}`,
        suggestions: l === 'ar' ? ['صرفت على إيه؟', 'أكتر حاجة صرفت عليها', 'دخلي كام؟'] : ['Where did I spend?', 'Top category', 'Income?'],
      };
    },
  },
  // ═══════════ صرف الشهر ═══════════
  {
    id: 'month_expense',
    test: (n) => /(صرفت|مصروفي|صرفي|المصاريف|صرف كام|spent|spending|expenses)/.test(n) && !/(علي|فين|ايه|على ايه|اكتر|تصنيف)/.test(n),
    answer: (s, l, f) => {
      const m = monthStats(s, todayISO());
      return {
        text: l === 'ar'
          ? `💸 صرفت ${money(m.expense, l, f)} الشهر ده.`
          : `💸 You spent ${money(m.expense, l, f)} this month.`,
        suggestions: l === 'ar' ? ['صرفت على إيه؟', 'أكتر حاجة صرفت عليها', 'دخلي كام؟'] : ['Spent on what?', 'Top category', 'Income?'],
      };
    },
  },
  // ═══════════ دخل الشهر ═══════════
  {
    id: 'month_income',
    test: (n) => /(دخلي|قبضت|الايراد|الدخل|راتبي|راتب|income|earned|salary)/.test(n) && !/(مصدر|مصادر|فين)/.test(n),
    answer: (s, l, f) => {
      const m = monthStats(s, todayISO());
      return {
        text: l === 'ar'
          ? `💰 دخلك الشهر ده ${money(m.income, l, f)}.`
          : `💰 Your income this month: ${money(m.income, l, f)}.`,
        suggestions: l === 'ar' ? ['صرفت كام؟', 'دخلي من فين؟', 'صافي الشهر'] : ['How much spent?', 'Income sources?', 'Net?'],
      };
    },
  },
  // ═══════════ مصادر الدخل ═══════════
  {
    id: 'income_sources',
    test: (n) => /(دخلي من فين|مصادر الدخل|income sources?|where.*income)/.test(n),
    answer: (s, l, f) => {
      const m = monthStats(s, todayISO());
      const entries = Object.entries(m.bySource || {}).sort((a, b) => b[1] - a[1]);
      if (!entries.length) return { text: l === 'ar' ? 'مفيش دخل مسجل الشهر ده.' : 'No income recorded this month.' };
      const lines = entries.map(([sid, amt]) => {
        const src = s.categories.find((c) => c.id === sid) || { ar: sid, en: sid, icon: 'dot' };
        return `• ${src[l] || src.ar}: ${money(amt, l, f)}`;
      });
      return { text: (l === 'ar' ? 'دخلك من:' : 'Your income from:') + '\n\n' + lines.join('\n'), suggestions: [] };
    },
  },
  // ═══════════ صرف النهارده ═══════════
  {
    id: 'today_expense',
    test: (n) => /(النهارده|اليوم|today)/.test(n) && /(صرفت|مصروف|spent|spend)/.test(n),
    answer: (s, l, f) => {
      const t = todayISO();
      const dayTotal = s.transactions
        .filter((x) => x.type === 'expense' && x.date === t)
        .reduce((sum, x) => sum + x.amount, 0);
      const count = s.transactions.filter((x) => x.type === 'expense' && x.date === t).length;
      return {
        text: l === 'ar'
          ? `صرفت النهارده ${money(dayTotal, l, f)} في ${count} عملية.`
          : `You spent ${money(dayTotal, l, f)} today in ${count} transactions.`,
        suggestions: l === 'ar' ? ['صرفت كام الشهر؟', 'آخر عملية'] : ['This month?', 'Last transaction'],
      };
    },
  },
  // ═══════════ صرف على تصنيف ═══════════
  {
    id: 'category_spend',
    test: (n) => /(صرفت|صرف).*(علي|على|في)|spent on/i.test(n),
    answer: (s, l, f, text) => {
      const n = nrm(text);
      const m = monthStats(s, todayISO());
      for (const c of s.categories) {
        const names = [c.ar, c.en].filter(Boolean).map(nrmName);
        if (names.some((nm) => n.includes(nm))) {
          const amt = m.byCat[c.id] || 0;
          return {
            text: l === 'ar'
              ? `صرفت على ${c[l]} ${money(amt, l, f)} الشهر ده.`
              : `You spent ${money(amt, l, f)} on ${c[l]} this month.`,
            suggestions: [],
          };
        }
      }
      return null;
    },
  },
  // ═══════════ أكتر تصنيف ═══════════
  {
    id: 'top_category',
    test: (n) => /(اكتر|أكبر|اعلي|top|most).*(صرف|تصنيف|category|spent)/.test(n) || /(صرفت على ايه|spent on what|where.*spend)/.test(n),
    answer: (s, l, f) => {
      const m = monthStats(s, todayISO());
      const entries = Object.entries(m.byCat).sort((a, b) => b[1] - a[1]);
      if (!entries.length) return { text: l === 'ar' ? 'مفيش مصاريف مسجلة الشهر ده.' : 'No expenses this month.' };
      const lines = entries.slice(0, 5).map(([cid, amt]) => {
        const cat = s.categories.find((c) => c.id === cid);
        const pct = m.expense > 0 ? Math.round((amt / m.expense) * 100) : 0;
        return `• ${cat ? cat[l] : cid}: ${money(amt, l, f)} (${pct}%)`;
      });
      return {
        text: (l === 'ar' ? 'أكتر حاجات صرفت عليها الشهر ده:\n\n' : 'Top spending categories this month:\n\n') + lines.join('\n'),
        suggestions: l === 'ar' ? ['صرفت كام؟', 'ميزانياتي'] : ['Total?', 'Budgets'],
      };
    },
  },
  // ═══════════ آخر عملية ═══════════
  {
    id: 'last_tx',
    test: (n) => /(اخر|آخر|latest|last).*(عمليه|transaction|movement)/.test(n),
    answer: (s, l, f) => {
      if (!s.transactions.length) return { text: l === 'ar' ? 'لسه مفيش عمليات.' : 'No transactions yet.' };
      const sorted = [...s.transactions].sort((a, b) => b.date.localeCompare(a.date));
      const last = sorted[0];
      const cat = s.categories.find((c) => c.id === last.categoryId);
      const acc = s.accounts.find((a) => a.id === last.accountId);
      const sign = last.type === 'income' ? '+' : last.type === 'expense' ? '−' : '';
      return {
        text: l === 'ar'
          ? `آخر عملية:\n\n${sign}${money(last.amount, l, f)}\n${cat ? cat[l] : ''} ${acc ? '· ' + acc[l] : ''}\nبتاريخ ${last.date}`
          : `Latest transaction:\n\n${sign}${money(last.amount, l, f)}\n${cat ? cat[l] : ''} ${acc ? '· ' + acc[l] : ''}\nOn ${last.date}`,
        suggestions: [],
      };
    },
  },
  // ═══════════ قائمة الأهداف ═══════════
  {
    id: 'goals_list',
    test: (n) => /(اهدافي|اهداف|هدفي|goals?|my goal)/.test(n) && !/(فاضل|باقي|وصل|progress|remaining|left)/.test(n),
    answer: (s, l, f) => {
      if (!s.goals.length) return { text: l === 'ar' ? 'لسه مفيش أهداف. اعمل أول هدف!' : 'No goals yet. Create one!' };
      const lines = s.goals.map((g) => {
        const saved = goalSaved(g, s.transactions);
        const pct = g.target > 0 ? Math.round((saved / g.target) * 100) : 0;
        return `• ${g.name[l]}: ${money(saved, l, f)} / ${money(g.target, l, f)} (${pct}%)`;
      });
      return {
        text: (l === 'ar' ? 'أهدافك:\n\n' : 'Your goals:\n\n') + lines.join('\n'),
        suggestions: l === 'ar' ? ['الهدف وصل لفين؟'] : ['Goal progress?'],
      };
    },
  },
  // ═══════════ باقي على هدف ═══════════
  {
    id: 'goal_remaining',
    test: (n) => /(فاضل|باقي|متبقي|remaining|left).*(هدف|goal|علي الهدف|على الهدف)/.test(n) || /how much (left|remaining).*goal/.test(n),
    answer: (s, l, f, text) => {
      if (!s.goals.length) return { text: l === 'ar' ? 'مفيش أهداف لسه.' : 'No goals yet.' };
      const n = nrm(text);
      let goal = s.goals.find((g) => [g.name.ar, g.name.en].filter(Boolean).map(nrmName).some((nm) => n.includes(nm)));
      if (!goal) goal = s.goals[0];
      const saved = goalSaved(goal, s.transactions);
      const remaining = Math.max(0, goal.target - saved);
      const pct = goal.target > 0 ? Math.round((saved / goal.target) * 100) : 0;
      return {
        text: l === 'ar'
          ? `هدف "${goal.name[l]}":\n\n✅ وفّرت: ${money(saved, l, f)}\n🎯 المطلوب: ${money(goal.target, l, f)}\n⏳ فاضل: ${money(remaining, l, f)}\n📊 وصلت: ${pct}%`
          : `Goal "${goal.name[l]}":\n\n✅ Saved: ${money(saved, l, f)}\n🎯 Target: ${money(goal.target, l, f)}\n⏳ Left: ${money(remaining, l, f)}\n📊 Progress: ${pct}%`,
        suggestions: l === 'ar' ? ['أهدافي', 'ميزانياتي'] : ['My goals', 'Budgets'],
      };
    },
  },
  // ═══════════ تقدم هدف ═══════════
  {
    id: 'goal_progress',
    test: (n) => /(هدف|goal).*(وصل|فين|progress|كام في الميه|من الميه|%)/.test(n) || /(how.*goal.*progress)/.test(n),
    answer: (s, l, f, text) => {
      if (!s.goals.length) return { text: l === 'ar' ? 'مفيش أهداف لسه.' : 'No goals yet.' };
      const n = nrm(text);
      let goal = s.goals.find((g) => [g.name.ar, g.name.en].filter(Boolean).map(nrmName).some((nm) => n.includes(nm)));
      if (!goal) goal = s.goals[0];
      const saved = goalSaved(goal, s.transactions);
      const pct = goal.target > 0 ? Math.round((saved / goal.target) * 100) : 0;
      const remaining = Math.max(0, goal.target - saved);
      return {
        text: l === 'ar'
          ? `${goal.name[l]} وصل ${pct}% من هدفك.\n\n✅ ${money(saved, l, f)} من ${money(goal.target, l, f)}\nباقي ${money(remaining, l, f)}`
          : `${goal.name[l]} is at ${pct}% of your goal.\n\n✅ ${money(saved, l, f)} of ${money(goal.target, l, f)}\nRemaining: ${money(remaining, l, f)}`,
        suggestions: [],
      };
    },
  },
  // ═══════════ باقي ميزانية ═══════════
  {
    id: 'budget_left',
    test: (n) => /(باقي|فاضل).*(ميزانيه|budget)/.test(n) || /(budget|ميزانيه).*(باقي|فاضل|remaining|left)/.test(n),
    answer: (s, l, f, text) => {
      if (!s.budgets.length) return { text: l === 'ar' ? 'مفيش ميزانيات محددة.' : 'No budgets set.' };
      const m = monthStats(s, todayISO());
      const n = nrm(text);
      for (const b of s.budgets) {
        const cat = s.categories.find((c) => c.id === b.categoryId);
        if (!cat) continue;
        const names = [cat.ar, cat.en].filter(Boolean).map(nrmName);
        if (names.some((nm) => n.includes(nm))) {
          const spent = m.byCat[b.categoryId] || 0;
          const left = Math.max(0, b.amount - spent);
          const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
          return {
            text: l === 'ar'
              ? `ميزانية ${cat[l]}:\n\n💰 الحد: ${money(b.amount, l, f)}\n💸 صرفت: ${money(spent, l, f)}\n${left > 0 ? '✅ باقي' : '⚠️ عدّيت'}: ${money(left > 0 ? left : spent - b.amount, l, f)}\n📊 ${pct}%`
              : `Budget for ${cat[l]}:\n\n💰 Limit: ${money(b.amount, l, f)}\n💸 Spent: ${money(spent, l, f)}\n${left > 0 ? '✅ Left' : '⚠️ Over'}: ${money(left > 0 ? left : spent - b.amount, l, f)}\n📊 ${pct}%`,
            suggestions: [],
          };
        }
      }
      // مفيش تصنيف محدد — اعرض الكل
      const lines = s.budgets.slice(0, 6).map((b) => {
        const cat = s.categories.find((c) => c.id === b.categoryId);
        const spent = m.byCat[b.categoryId] || 0;
        const left = Math.max(0, b.amount - spent);
        return `• ${cat ? cat[l] : '—'}: باقي ${money(left, l, f)} من ${money(b.amount, l, f)}`;
      });
      return {
        text: (l === 'ar' ? 'ميزانياتك:\n\n' : 'Your budgets:\n\n') + lines.join('\n'),
        suggestions: [],
      };
    },
  },
  // ═══════════ ديون — عليك ═══════════
  {
    id: 'debts_owe',
    test: (n) => /(عليا\s+كام|عليا\s+قد|مديون|اخدت سلفه|i owe|how much.*i owe|لزمتي كام)/.test(n) || (/(^|\s)عليا(\s|$)/.test(n) && !/(ليا|ليك|owed|فلوس ليا)/.test(n) && /كام|قد|how much|مبلغ/.test(n)),
    answer: (s, l, f) => {
      const owe = s.debts.filter((d) => d.kind === 'owe');
      if (!owe.length) return { text: l === 'ar' ? 'الحمد لله، مفيش فلوس عليك.' : 'Nice, nothing you owe.' };
      const total = owe.reduce((sum, d) => sum + Math.max(0, (d.amount || 0) - (d.paid || 0)), 0);
      const lines = owe.map((d) => {
        const rem = Math.max(0, (d.amount || 0) - (d.paid || 0));
        return `• ${d.person[l]}: ${money(rem, l, f)}`;
      });
      return {
        text: l === 'ar'
          ? `عليك ${money(total, l, f)} في ${owe.length} دين:\n\n${lines.join('\n')}`
          : `You owe ${money(total, l, f)} across ${owe.length} debts:\n\n${lines.join('\n')}`,
        suggestions: l === 'ar' ? ['ليا كام؟', 'ديوني'] : ['Owed to me?', 'Debts'],
      };
    },
  },
  // ═══════════ ديون — ليك ═══════════
  {
    id: 'debts_owed',
    test: (n) => /(ليا\s+كام|ليا\s+قد|مستحق ليا|owed to me|how much.*owed)/.test(n) || (/(^|\s)ليا(\s|$)/.test(n) && !/عليا/.test(n) && /كام|قد|how much|مبلغ/.test(n)),
    answer: (s, l, f) => {
      const owed = s.debts.filter((d) => d.kind === 'owed');
      if (!owed.length) return { text: l === 'ar' ? 'مفيش حد عليك فلوس ليك.' : 'Nobody owes you money.' };
      const total = owed.reduce((sum, d) => sum + Math.max(0, (d.amount || 0) - (d.paid || 0)), 0);
      const lines = owed.map((d) => {
        const rem = Math.max(0, (d.amount || 0) - (d.paid || 0));
        return `• ${d.person[l]}: ${money(rem, l, f)}`;
      });
      return {
        text: l === 'ar'
          ? `ليك ${money(total, l, f)} عند ${owed.length} شخص:\n\n${lines.join('\n')}`
          : `You have ${money(total, l, f)} owed by ${owed.length} people:\n\n${lines.join('\n')}`,
        suggestions: l === 'ar' ? ['عليا كام؟', 'ديوني'] : ['What I owe?', 'Debts'],
      };
    },
  },
  // ═══════════ الأقساط ═══════════
  {
    id: 'installments',
    test: (n) => /(اقساطي|اقساط|قسط|installments?)/.test(n),
    answer: (s, l, f) => {
      if (!s.installments.length) return { text: l === 'ar' ? 'مفيش أقساط لسه.' : 'No installments yet.' };
      const lines = s.installments.map((i) => {
        const st = installmentStats(i);
        return `• ${i.name[l]}: ${st.remainingCount} قسط باقي · ${money(st.monthly, l, f)}/شهر · إجمالي باقي ${money(st.remainingAmount, l, f)}`;
      });
      const totalMonthly = s.installments.reduce((sum, i) => {
        const st = installmentStats(i);
        return sum + (st.remainingCount > 0 ? st.monthly : 0);
      }, 0);
      return {
        text: l === 'ar'
          ? `أقساطك:\n\n${lines.join('\n')}\n\n💰 إجمالي شهري: ${money(totalMonthly, l, f)}`
          : `Your installments:\n\n${lines.join('\n')}\n\n💰 Total monthly: ${money(totalMonthly, l, f)}`,
        suggestions: [],
      };
    },
  },
  // ═══════════ الالتزامات القادمة ═══════════
  {
    id: 'upcoming',
    test: (n) => /(عليا|قريب|قادم|الجاي|upcoming|due|مستحق)/.test(n) && !/(كام|فاضل)/.test(n),
    answer: (s, l, f) => {
      const items = upcomingItems(s, 30);
      if (!items.length) return { text: l === 'ar' ? 'مفيش حاجة مستحقة خلال 30 يوم.' : 'Nothing due in next 30 days.' };
      const lines = items.slice(0, 7).map((i) => {
        let when = i.days < 0 ? 'متأخر' : i.days === 0 ? 'النهارده' : i.days === 1 ? 'بكره' : `بعد ${i.days} يوم`;
        return `• ${i.name[l]}: ${money(i.amount, l, f)} — ${when}`;
      });
      const total = items.filter((i) => i.days >= 0).reduce((sum, i) => sum + i.amount, 0);
      return {
        text: l === 'ar'
          ? `عليك قريب:\n\n${lines.join('\n')}\n\n💰 إجمالي: ${money(total, l, f)}`
          : `Upcoming:\n\n${lines.join('\n')}\n\n💰 Total: ${money(total, l, f)}`,
        suggestions: [],
      };
    },
  },
  // ═══════════ نسبة التوفير ═══════════
  {
    id: 'savings_rate',
    test: (n) => /(نسبه|نسبة|ratio|rate).*(توفير|saving)|savings rate/.test(n),
    answer: (s, l, f) => {
      const m = monthStats(s, todayISO());
      if (m.income === 0) return { text: l === 'ar' ? 'مفيش دخل مسجل الشهر ده عشان أحسب نسبة التوفير.' : 'No income to calculate savings rate.' };
      const rate = Math.round(((m.income - m.expense) / m.income) * 100);
      return {
        text: l === 'ar'
          ? `📊 نسبة التوفير الشهر ده: ${rate}%\n\nدخل: ${money(m.income, l, f)}\nصرف: ${money(m.expense, l, f)}\nوفّرت: ${money(m.income - m.expense, l, f)}`
          : `📊 Savings rate this month: ${rate}%\n\nIncome: ${money(m.income, l, f)}\nSpent: ${money(m.expense, l, f)}\nSaved: ${money(m.income - m.expense, l, f)}`,
        suggestions: [],
      };
    },
  },
];
// ═══════════════════════════════════════════════════
// MAIN: يجرب كل query بالترتيب
// ═══════════════════════════════════════════════════
export function answerPersonal(text, state, lang, fmtMoney) {
  if (!text || !state) return null;
  const n = nrm(text);
  for (const q of QUERIES) {
    try {
      if (q.test(n)) {
        const result = q.answer(state, lang, fmtMoney, text);
        if (result && result.text) return result;
      }
    } catch (e) {
      // تجاهل أخطاء فردية
      console.warn('chat-personal error in', q.id, e);
    }
  }
  return null;
}
// ═══════════════════════════════════════════════════
// هل السؤال شخصي؟ (نستخدمها لترتيب الأولويات)
// ═══════════════════════════════════════════════════
export function isPersonalQuestion(text) {
  const n = nrm(text);
  const hints = [
    'معايا', 'رصيدي', 'فلوسي', 'صرفت', 'دخلي', 'قبضت',
    'عليا', 'ليا', 'اهدافي', 'هدفي', 'ميزانيتي', 'ميزانيه',
    'اقساط', 'قسط', 'ديون', 'ديوني', 'صافي ثروتي', 'ثروتي',
    'ملخص', 'اخر عمليه', 'باقي', 'فاضل',
    'my balance', 'i have', 'i spent', 'my income', 'i owe',
    'owed to me', 'my goals', 'my budget', 'my debts',
  ];
  return hints.some((h) => n.includes(h));
}