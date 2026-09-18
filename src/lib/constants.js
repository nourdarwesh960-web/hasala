export const STORAGE_KEY = 'hasala.v1';
export const ACCOUNT_TYPES = ['bank', 'debit', 'credit', 'cash', 'wallet', 'savings', 'other'];
export const ACCOUNT_COLORS = ['#0E9F6E', '#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#0891B2', '#65A30D', '#475569', '#B45309', '#DC2626'];
export const CURRENCIES = {
  EGP: { ar: 'ج.م', en: 'EGP' },
  USD: { ar: '$', en: 'USD' },
  EUR: { ar: '€', en: 'EUR' },
  SAR: { ar: 'ر.س', en: 'SAR' },
  AED: { ar: 'د.إ', en: 'AED' },
};
export const DEFAULT_CATEGORIES = [
  { id: 'cat_food', ar: 'أكل', en: 'Food', icon: 'utensils', color: '#F59E0B' },
  { id: 'cat_trans', ar: 'مواصلات', en: 'Transport', icon: 'car', color: '#3B82F6' },
  { id: 'cat_shop', ar: 'مشتريات', en: 'Shopping', icon: 'shoppingBag', color: '#EC4899' },
  { id: 'cat_bills', ar: 'فواتير', en: 'Bills', icon: 'receipt', color: '#8B5CF6' },
  { id: 'cat_ent', ar: 'ترفيه', en: 'Entertainment', icon: 'film', color: '#F97316' },
  { id: 'cat_health', ar: 'صحة', en: 'Health', icon: 'heart', color: '#EF4444' },
  { id: 'cat_edu', ar: 'تعليم', en: 'Education', icon: 'book', color: '#06B6D4' },
  { id: 'cat_subs', ar: 'اشتراكات', en: 'Subscriptions', icon: 'repeat', color: '#6366F1' },
  { id: 'cat_travel', ar: 'سفر', en: 'Travel', icon: 'plane', color: '#14B8A6' },
  { id: 'cat_family', ar: 'عيلة', en: 'Family', icon: 'house', color: '#84CC16' },
  { id: 'cat_other', ar: 'أخرى', en: 'Other', icon: 'dot', color: '#94A3B8' },
];
export const INCOME_SOURCES = [
  { id: 'src_salary', ar: 'راتب', en: 'Salary', icon: 'briefcase' },
  { id: 'src_free', ar: 'فريلانس', en: 'Freelance', icon: 'laptop' },
  { id: 'src_biz', ar: 'بيزنس', en: 'Business', icon: 'store' },
  { id: 'src_invest', ar: 'استثمار', en: 'Investment', icon: 'trendUp' },
  { id: 'src_gift', ar: 'هدية', en: 'Gift', icon: 'gift' },
  { id: 'src_other', ar: 'أخرى', en: 'Other', icon: 'dot' },
];
export const NAV_ITEMS = [
  { id: 'dashboard', icon: 'home', label: 'nav.dashboard' },
  { id: 'transactions', icon: 'list', label: 'nav.transactions' },
  { id: 'insights', icon: 'sparkles', label: 'nav.insights' },
  { id: 'accounts', icon: 'wallet', label: 'nav.accounts' },
  { id: 'goals', icon: 'target', label: 'nav.goals' },
  { id: 'budgets', icon: 'pie', label: 'nav.budgets' },
  { id: 'installments', icon: 'credit', label: 'nav.installments' },
  { id: 'debts', icon: 'users', label: 'nav.debts' },
  { id: 'calendar', icon: 'calendar', label: 'nav.calendar' },
  { id: 'analytics', icon: 'chart', label: 'nav.analytics' },
  { id: 'settings', icon: 'settings', label: 'nav.settings' },
];
export const MOBILE_NAV = [
  { id: 'dashboard', icon: 'home', label: 'nav.dashboard' },
  { id: 'transactions', icon: 'list', label: 'nav.transactions' },
  { id: 'fab', icon: 'plus', label: 'tx.add' },
  { id: 'insights', icon: 'sparkles', label: 'nav.insights' },
  { id: 'more', icon: 'more', label: 'nav.more' },
];
export const MORE_ITEMS = [
  { id: 'insights', icon: 'sparkles', label: 'nav.insights' },
  { id: 'budgets', icon: 'pie', label: 'nav.budgets' },
  { id: 'installments', icon: 'credit', label: 'nav.installments' },
  { id: 'debts', icon: 'users', label: 'nav.debts' },
  { id: 'calendar', icon: 'calendar', label: 'nav.calendar' },
  { id: 'accounts', icon: 'wallet', label: 'nav.accounts' },
  { id: 'analytics', icon: 'chart', label: 'nav.analytics' },
  { id: 'settings', icon: 'settings', label: 'nav.settings' },
];