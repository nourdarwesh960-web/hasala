import { uid, todayISO, addDays } from './utils';
import { DEFAULT_CATEGORIES } from './constants';
export function blankState() {
return {
version: 1, onboarded: false, tourDone: false, profile: { name: '' },
settings: { lang: 'ar', theme: 'dark', currency: 'EGP' },
categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, custom: false })),
accounts: [], transactions: [], goals: [], budgets: [],
recurring: [], reminders: [], debts: [], installments: [], custodies: [], custodyTransactions: [], dismissedNotifs: [],
};
}
export function demoState() {
const s = blankState();
s.onboarded = true;
const accCib = { id: uid('acc'), name: { ar: 'فيزا CIB', en: 'CIB Visa' }, type: 'credit', initialBalance: -4200, currency: 'EGP', color: '#7C3AED', note: '' };
const accCash = { id: uid('acc'), name: { ar: 'كاش', en: 'Cash' }, type: 'cash', initialBalance: 3200, currency: 'EGP', color: '#0E9F6E', note: '' };
const accBank = { id: uid('acc'), name: { ar: 'حساب بنكي', en: 'Bank Account' }, type: 'bank', initialBalance: 18400, currency: 'EGP', color: '#2563EB', note: '' };
const accSave = { id: uid('acc'), name: { ar: 'توفير', en: 'Savings' }, type: 'savings', initialBalance: 26000, currency: 'EGP', color: '#0891B2', note: '' };
const accVoda = { id: uid('acc'), name: { ar: 'فودافون كاش', en: 'Vodafone Cash' }, type: 'wallet', initialBalance: 1850, currency: 'EGP', color: '#DC2626', note: '' };
s.accounts = [accCib, accCash, accBank, accSave, accVoda];
const today = todayISO();
const D = (n) => addDays(today, -n);
const F = (n) => addDays(today, n);
const txs = [];
const push = (o) => txs.push({ id: uid('tx'), ...o });
push({ type: 'income', amount: 15000, categoryId: 'src_salary', sourceId: 'src_salary', accountId: accBank.id, date: D(22), note: { ar: 'راتب الشهر', en: 'Monthly salary' } });
push({ type: 'income', amount: 15000, categoryId: 'src_salary', sourceId: 'src_salary', accountId: accBank.id, date: D(52), note: { ar: 'راتب الشهر اللي فات', en: 'Last month salary' } });
push({ type: 'income', amount: 6500, categoryId: 'src_free', sourceId: 'src_free', accountId: accVoda.id, date: D(15), note: { ar: 'مشروع تصميم', en: 'Design project' } });
push({ type: 'income', amount: 8000, categoryId: 'src_biz', sourceId: 'src_biz', accountId: accBank.id, date: D(9), note: { ar: 'مبيعات', en: 'Sales' } });
const E = (amount, cat, acc, d, nAr, nEn) => push({ type: 'expense', amount, categoryId: cat, accountId: acc, date: d, note: { ar: nAr, en: nEn } });
E(320, 'cat_food', accCash, D(1), 'عشاء بره', 'Dinner out');
E(185, 'cat_trans', accCib, D(1), 'أوبر', 'Uber');
E(540, 'cat_food', accCib, D(2), 'سوبر ماركت', 'Supermarket');
E(1250, 'cat_shop', accCib, D(3), 'أمازون', 'Amazon');
E(500, 'cat_bills', accBank, D(4), 'النت', 'Internet');
E(300, 'cat_subs', accCib, D(5), 'نتفليكس', 'Netflix');
E(240, 'cat_trans', accCash, D(6), 'بنزين', 'Fuel');
E(890, 'cat_food', accCib, D(7), 'مطاعم', 'Restaurants');
E(700, 'cat_ent', accCib, D(8), 'سينما', 'Cinema');
E(430, 'cat_health', accCash, D(9), 'صيدلية', 'Pharmacy');
E(1500, 'cat_shop', accCib, D(10), 'هدوم', 'Clothes');
E(350, 'cat_trans', accCib, D(11), 'أوبر', 'Uber');
E(260, 'cat_food', accCash, D(12), 'قهوة', 'Coffee');
E(3000, 'cat_bills', accBank, D(13), 'إيجار', 'Rent');
E(420, 'cat_edu', accCib, D(14), 'كورس', 'Course');
E(600, 'cat_family', accCash, D(16), 'هدية عيلة', 'Family gift');
E(980, 'cat_food', accCib, D(18), 'سوبر ماركت', 'Supermarket');
E(210, 'cat_trans', accCib, D(19), 'تاكسي', 'Taxi');
E(2200, 'cat_shop', accCib, D(20), 'موبايل', 'Phone');
E(450, 'cat_ent', accCib, D(21), 'خروجة', 'Night out');
E(1250, 'cat_food', accCash, D(24), 'أكل', 'Food');
E(1800, 'cat_travel', accBank, D(26), 'تذاكر سفر', 'Travel tickets');
E(340, 'cat_trans', accCib, D(28), 'بنزين', 'Fuel');
E(760, 'cat_food', accCib, D(30), 'مطاعم', 'Restaurants');
E(1500, 'cat_shop', accCib, D(33), 'ملابس', 'Clothes');
E(3000, 'cat_bills', accBank, D(43), 'إيجار', 'Rent');
E(520, 'cat_food', accCib, D(46), 'سوبر ماركت', 'Supermarket');
E(300, 'cat_subs', accCib, D(35), 'نتفليكس', 'Netflix');
E(700, 'cat_ent', accCib, D(38), 'جيم', 'Gym');
push({ type: 'transfer', amount: 5000, accountId: accBank.id, toAccountId: accCash.id, date: D(5), note: { ar: 'سحب كاش', en: 'Cash withdrawal' } });
s.transactions = txs.sort((a, b) => b.date.localeCompare(a.date));
const g1 = { id: uid('goal'), name: { ar: 'آيفون 17 برو', en: 'iPhone 17 Pro' }, target: 42000, initialSaved: 12000, deadline: F(400), type: 'long', color: '#7C3AED', icon: '' };
const g2 = { id: uid('goal'), name: { ar: 'رحلة', en: 'Trip' }, target: 10000, initialSaved: 7500, deadline: F(60), type: 'short', color: '#0E9F6E', icon: '' };
const g3 = { id: uid('goal'), name: { ar: 'شقة جديدة', en: 'New Apartment' }, target: 150000, initialSaved: 35000, deadline: F(900), type: 'long', color: '#2563EB', icon: '' };
s.goals = [g1, g2, g3];
push({ type: 'goal', amount: 6500, accountId: accBank.id, goalId: g1.id, date: D(12), note: { ar: 'توفير', en: 'Saving' } });
s.budgets = [
{ id: uid('bud'), categoryId: 'cat_food', amount: 4000 },
{ id: uid('bud'), categoryId: 'cat_trans', amount: 1500 },
{ id: uid('bud'), categoryId: 'cat_shop', amount: 4000 },
{ id: uid('bud'), categoryId: 'cat_bills', amount: 4000 },
{ id: uid('bud'), categoryId: 'cat_ent', amount: 1500 },
];
s.recurring = [
{ id: uid('rec'), name: { ar: 'نتفليكس', en: 'Netflix' }, amount: 300, frequency: 'monthly', nextDate: F(4), accountId: accCib.id, categoryId: 'cat_subs' },
{ id: uid('rec'), name: { ar: 'النت', en: 'Internet' }, amount: 500, frequency: 'monthly', nextDate: F(1), accountId: accBank.id, categoryId: 'cat_bills' },
{ id: uid('rec'), name: { ar: 'الجيم', en: 'Gym' }, amount: 700, frequency: 'monthly', nextDate: F(8), accountId: accCib.id, categoryId: 'cat_ent' },
{ id: uid('rec'), name: { ar: 'الموبايل', en: 'Phone' }, amount: 350, frequency: 'monthly', nextDate: F(12), accountId: accVoda.id, categoryId: 'cat_bills' },
];
s.reminders = [
{ id: uid('rem'), name: { ar: 'إيجار الشقة', en: 'Rent' }, amount: 3000, date: F(6), note: { ar: '', en: '' }, done: false },
];
s.debts = [
{ id: uid('debt'), kind: 'owe', person: { ar: 'أحمد', en: 'Ahmed' }, amount: 2000, paid: 500, date: D(30), dueDate: F(5), note: { ar: 'سلفة', en: 'Loan' } },
{ id: uid('debt'), kind: 'owe', person: { ar: 'محمد', en: 'Mohamed' }, amount: 1000, paid: 0, date: D(12), dueDate: F(20), note: { ar: '', en: '' } },
{ id: uid('debt'), kind: 'owed', person: { ar: 'علي', en: 'Ali' }, amount: 2500, paid: 0, date: D(20), dueDate: F(10), note: { ar: '', en: '' } },
{ id: uid('debt'), kind: 'owed', person: { ar: 'منى', en: 'Mona' }, amount: 1500, paid: 0, date: D(8), dueDate: F(2), note: { ar: '', en: '' } },
];
s.installments = [
{ id: uid('inst'), name: { ar: 'آيفون 17 برو', en: 'iPhone 17 Pro' }, total: 42000, count: 12, monthly: 3500, paidCount: 5, startDate: addDays(today, -150), accountId: accBank.id, icon: '', color: '#7C3AED' },
{ id: uid('inst'), name: { ar: 'لابتوب', en: 'Laptop' }, total: 36000, count: 12, monthly: 3000, paidCount: 2, startDate: addDays(today, -60), accountId: accCib.id, icon: '', color: '#2563EB' },
];
return s;
}