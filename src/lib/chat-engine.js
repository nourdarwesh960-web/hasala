/* ══════════════════════════════════════════════════════════════════
EL-HASALA — SMART CHAT ENGINE v2
Real NLU. Offline. No API.
══════════════════════════════════════════════════════════════════ */
// ═══════════════════════════════════════════════════════════════
// 1. TEXT NORMALIZATION (Arabic + English + slang)
// ═══════════════════════════════════════════════════════════════
export function normalize(text) {
if (!text) return '';
let t = String(text).toLowerCase().trim();
// Remove diacritics
t = t.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC]/g, '');
// Alif variants → ا
t = t.replace(/[أإآٱا]/g, 'ا');
// Ya variants → ي
t = t.replace(/[ىي]/g, 'ي');
// Ta marbuta → ه
t = t.replace(/[ةه]/g, 'ه');
// Hamza
t = t.replace(/[ؤئ]/g, 'ء').replace(/ء/g, '');
// English → normal
t = t.replace(/\bu\b/g, 'you');
t = t.replace(/\bur\b/g, 'your');
t = t.replace(/\bplz\b/g, 'please');
t = t.replace(/\bpls\b/g, 'please');
t = t.replace(/\bthx\b/g, 'thanks');
t = t.replace(/\bwtf\b/g, '');
t = t.replace(/\bim\b/g, 'i am');
t = t.replace(/\bdont\b/g, 'do not');
t = t.replace(/\bcant\b/g, 'cannot');
t = t.replace(/\bwont\b/g, 'will not');
// Egyptian/Arabic slang
t = t.replace(/\bازاى\b/g, 'ازاي');
t = t.replace(/\bايه ده\b/g, 'ايه ده');
t = t.replace(/\bمعايا\b/g, 'معايا');
t = t.replace(/\bاقدر\b/g, 'اقدر');
t = t.replace(/\bينفع\b/g, 'ينفع');
// Punctuation → space
t = t.replace(/[^\p{L}\p{N}\s]/gu, ' ');
// Collapse
t = t.replace(/\s+/g, ' ').trim();
return t;
}
// ═══════════════════════════════════════════════════════════════
// 2. TOKENIZE
// ═══════════════════════════════════════════════════════════════
export function tokenize(text) {
const n = normalize(text);
return n.split(' ').filter(Boolean);
}
// ═══════════════════════════════════════════════════════════════
// 3. STOPWORDS
// ═══════════════════════════════════════════════════════════════
const AR_STOP = new Set(['في', 'من', 'على', 'عن', 'الى', 'مع', 'هو', 'هي', 'انا', 'انت', 'احنا', 'هم', 'ده', 'دي', 'دا', 'ان', 'انا', 'لو', 'كان', 'كانت', 'يكون', 'و', 'او', 'بس', 'بعد', 'قبل', 'كل', 'بعض']);
const EN_STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'am', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'and', 'or', 'but', 'if', 'so', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
function isStop(w) {
return AR_STOP.has(w) || EN_STOP.has(w);
}
// ═══════════════════════════════════════════════════════════════
// 4. LIGHT STEMMER
// ═══════════════════════════════════════════════════════════════
export function stem(word) {
if (!word || word.length < 3) return word;
// Arabic definite article
word = word.replace(/^ال(?=.{3})/, '');
// Arabic prefixes
word = word.replace(/^(وال|بال|فال|كال)(?=.{3})/, '');
// Arabic suffixes (longer first)
word = word.replace(/(ها|هم|هن|كم|كن|نا|ية|يه|ات|ون|ين|ين)$/, m => m.length >= 3 && word.length - m.length >= 3 ? '': m);
// English suffixes
word = word.replace(/ies$/, 'y');
word = word.replace(/ing$/, '');
word = word.replace(/ed$/, '');
word = word.replace(/es$/, '');
word = word.replace(/s$/, '');
return word;
}
// ═══════════════════════════════════════════════════════════════
// 5. LEVENSHTEIN (fuzzy)
// ═══════════════════════════════════════════════════════════════
function lev(a, b) {
if (a === b) return 0;
const al = a.length, bl = b.length;
if (!al) return bl;
if (!bl) return al;
let prev = Array.from({ length: bl + 1 }, (_, i) => i);
for (let i = 1; i <= al; i++) {
const cur = [i];
for (let j = 1; j <= bl; j++) {
const cost = a[i - 1] === b[j - 1] ? 0: 1;
cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
}
prev = cur;
}
return prev[bl];
}
function fuzzy(a, b) {
if (a === b) return 1;
const maxLen = Math.max(a.length, b.length);
if (maxLen < 3) return 0;
const dist = lev(a, b);
if (dist === 0) return 1;
if (dist === 1) return 0.85;
if (maxLen >= 5 && dist === 2) return 0.6;
if (maxLen >= 7 && dist === 3) return 0.4;
return 0;
}
// ═══════════════════════════════════════════════════════════════
// 6. SYNONYM MAP — expands user tokens
// ═══════════════════════════════════════════════════════════════
const SYNONYMS = {
// Adding/money actions
'اضيف': ['اضف', 'ضيف', 'سجل', 'اسجل', 'اكتب', 'دخل'],
'حذف': ['امسح', 'شيل', 'الغي', 'remove'],
'تعديل': ['اعدل', 'اغير', 'بدل', 'update'],
'تحويل': ['حول', 'نقل', 'transfer'],
'دفع': ['سدد', 'سداد', 'اسدد', 'pay'],
'فلوس': ['نقود', 'كاش', 'money', 'cash'],
'حساب': ['حسابات', 'account', 'بنك', 'card', 'كارت'],
'مصروف': ['صرف', 'صرفت', 'expense', 'spending'],
'دخل': ['راتب', 'income', 'salary', 'ايراد'],
'هدف': ['اهداف', 'goal', 'حلم', 'طموح'],
'ميزانيه': ['budget', 'حد', 'limit', 'سقف'],
'تقرير': ['تحليل', 'تحليلات', 'analytics', 'report', 'chart'],
'امان': ['امن', 'بامان', 'security', 'safe', 'خصوصيه', 'privacy'],
'لغه': ['language', 'عربي', 'انجليزي', 'english'],
'مظهر': ['theme', 'ثيم', 'dark', 'light', 'فاتح', 'غامق'],
'تصدير': ['export', 'backup', 'نسخه', 'باكلوب'],
'استيراد': ['import', 'restore', 'رجع'],
'مساعده': ['help', 'support', 'دعم', 'نجده'],
'مشكله': ['bug', 'issue', 'problem', 'غلط', 'error'],
// Features
'اقساط': ['قسط', 'installment', 'تقسيط'],
'ديون': ['دين', 'debt', 'مديونيه', 'سلفه'],
'تنبيهات': ['اشعارات', 'reminders', 'notifications', 'تنبيه'],
'متكرر': ['recurring', 'اشتراك', 'subscription', 'شهري'],
'تقويم': ['calendar', 'مواعيد', 'dates'],
'شخصيه': ['profile', 'avatar', 'photo', 'صورة'],
'عمله': ['currency', 'جنيه', 'دولار', 'egp', 'usd'],
};
function expandSynonyms(tokens) {
const out = new Set(tokens);
for (const tok of tokens) {
const stemmed = stem(tok);
for (const [key, values] of Object.entries(SYNONYMS)) {
if (tok === key || stemmed === stem(key) || values.includes(tok)) {
out.add(key);
values.forEach((v) => out.add(v));
}
}
}
return Array.from(out);
}
// ═══════════════════════════════════════════════════════════════
// 7. KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════
const KB = [
// ─── GENERAL ───
{ id: 'about', topic: 'intro', kw: ['الحصاله', 'التطبيق', 'ايه ده', 'ايه هو', 'ايه هي', 'what', 'about', 'app', 'hasala', 'elhasala', 'برنامج', 'تطبيق'],
ar: 'الحصالة تطبيق شخصي لإدارة فلوسك. بيعرفك فلوسك فين، بتصرف على إيه، وإزاي توصل لأهدافك. كل ده على جهازك — بدون سيرفرات ولا حسابات.',
en: 'El-Hasala is a personal finance app. It shows where your money is, what you spend on, and how to reach your goals. All on your device — no servers, no accounts.',
sg: ['ايه المميزات؟', 'ازاي ابدأ؟', 'مجاني؟'] },
{ id: 'features', topic: 'intro', kw: ['مميزات', 'ميزات', 'feature', 'features', 'بتعمل ايه', 'بتقدم ايه', 'بتشمل ايه', 'فيها ايه'],
ar: 'الحصالة فيها كل ده:\n\n متابعة حساباتك (بنك، كاش، كريدت، محفظة، توفير)\n تسجيل عمليات (مصروف، دخل، تحويل)\n أهداف مالية مع متابعة تقدمك\n ميزانيات شهرية لكل تصنيف\n أقساط ومدفوعات\n ديون (اللي عليك واللي ليك)\n اشتراكات متكررة وتنبيهات\n تقويم مالي شامل\n�� تحليلات ورسوم بيانية\n إضافة ذكية بالعربي\n ملاحظات ذكية على صرفك\n حساب صافي الثروة',
en: 'El-Hasala has everything:\n\n Account tracking (bank, cash, credit, wallet, savings)\n Transactions (expense, income, transfer)\n Goals with progress\n Monthly budgets per category\n Installments & payments\n Debts (owe & owed)\n Recurring bills & reminders\n Financial calendar\n Analytics & charts\n Smart Add in Arabic\n Auto smart insights\n Net worth calculation',
sg: ['ازاي اضيف عمليه؟', 'ازاي اعمل هدف؟', 'ازاي احط ميزانيه؟'] },
{ id: 'start', topic: 'intro', kw: ['ابدأ', 'ابدا', 'بدايه', 'start', 'begin', 'setup', 'استخدام', 'جديد', 'اول مره'],
ar: 'ابدأ في 3 خطوات:\n\n1. اضغط "ابدأ دلوقتي" من الصفحة الرئيسية\n2. اكتب اسمك (اختياري) أو حمّل بيانات تجريبية\n3. اضغط "+" عشان تسجل أول عملية\n\nنصيحة: البيانات التجريبية هتوريك كل المميزات فورًا!',
en: 'Start in 3 steps:\n\n1. Click "Get started" on landing\n2. Enter name (optional) or load demo data\n3. Click "+" to log your first transaction\n\nTip: Demo data shows you all features instantly!',
sg: ['ازاي اضيف عمليه؟', 'ايه المميزات؟', 'مجاني؟'] },
{ id: 'free', topic: 'intro', kw: ['مجاني', 'ببلاش', 'فلوس', 'price', 'free', 'paid', 'مدفوع', 'اشتراك', 'رسوم'],
ar: 'الحصالة مجاني بالكامل. مفيش اشتراكات، مفيش إعلانات، مفيش نسخة مدفوعة. كل المميزات مفتوحة للجميع.',
en: 'El-Hasala is completely free. No subscriptions, no ads, no paid tier. All features open to everyone.',
sg: ['ايه المميزات؟', 'امان؟'] },
// ─── SECURITY ───
{ id: 'security', topic: 'security', kw: ['امان', 'امن', 'بامان', 'secure', 'security', 'safe', 'بياناتي', 'خصوصيه', 'privacy', 'سيرفر', 'server', 'تسريب'],
ar: 'كل بياناتك محفوظة على جهازك فقط — مفيش سيرفرات.\n\n مفيش تسجيل حساب\n مفيش إنترنت مطلوب\n مفيش تتبع أو إعلانات\n محدش يشوفها غيرك\n\nحتى إحنا ما بنشوفش بياناتك.',
en: 'All your data is on your device only — no servers.\n\n No account needed\n No internet required\n No tracking or ads\n Nobody sees it but you\n\nNot even us.',
sg: ['ازاي اصدر بياناتي؟', 'بيشتغل اوفلاين؟', 'ازاي امسح كل حاجه؟'] },
{ id: 'offline', topic: 'security', kw: ['اوفلاين', 'offline', 'انترنت', 'نت', 'بدون نت', 'بدون انترنت', 'شغال بدون'],
ar: 'التطبيق بيشتغل بدون إنترنت تمامًا.\n\nكل الحسابات محلية، كل البيانات عندك، وكل المميزات شغالة حتى لو النت مقطوع.',
en: 'The app works completely offline.\n\nAll calculations local, all data on your device, all features work even with no internet.',
sg: ['امان؟', 'ازاي اصدر بياناتي؟'] },
// ─── ADD TRANSACTIONS ───
{ id: 'add-tx', topic: 'adding', kw: ['اضيف', 'اضف', 'ضيف', 'عمليه', 'transaction', 'add', 'تسجيل عمليه', 'اسجل'],
ar: '3 طرق لإضافة عملية:\n\n1⃣ زر "+" العائم في الأسفل (أو FAB)\n2⃣ Ctrl+K → اكتب "دفعت 250 أكل من CIB"\n3⃣ صفحة العمليات → زر "إضافة"\n\nالتطبيق يفتكر آخر تصنيف وحساب استخدمتهم — أسرع مع كل استخدام!',
en: '3 ways to add:\n\n1⃣ "+" floating button\n2⃣ Ctrl+K → type "Spent 250 food from CIB"\n3⃣ Transactions page → "Add"\n\nApp remembers last category & account — faster each time!',
sg: ['ايه هي الاضافه الذكيه؟', 'ازاي اعمل تحويل؟', 'ازاي اعدل عمليه؟'] },
{ id: 'smart-add', topic: 'adding', kw: ['ذكيه', 'ذكي', 'smart', 'طبيعي', 'جمله', 'نص', 'sentence', 'بالعربي'],
ar: 'الإضافة الذكية بتخليك تكتب طبيعي:\n\n "دفعت 250 أكل من CIB امبارح"\n "أوبر 185 كاش"\n "قبضت 15000 راتب"\n "صرفت 300 على نتفليكس بكرة"\n\nالتطبيق يفهم المبلغ + التصنيف + الحساب + التاريخ تلقائيًا. جرّبها من زر ',
en: 'Smart Add lets you write naturally:\n\n "Spent 250 food from CIB yesterday"\n "Uber 185 cash"\n "Received 15000 salary"\n "Paid 300 for Netflix tomorrow"\n\nUnderstands amount + category + account + date automatically. Try the button!',
sg: ['ازاي اضيف عمليه؟', 'ايه المميزات؟'] },
{ id: 'transfer', topic: 'adding', kw: ['تحويل', 'احول', 'حول', 'transfer', 'بين الحسابات', 'نقل'],
ar: 'التحويل بين الحسابات مش مصروف ومش دخل — بس نقل فلوس.\n\nمثال: CIB ← كاش بـ 5000\nالنتيجة:\n• CIB ناقص 5000\n• الكاش زايد 5000\n• صافي الثروة ما اتغيرش ',
en: 'Transfer is NOT income or expense — just moving money.\n\nExample: CIB → Cash 5000\nResult:\n• CIB -5000\n• Cash +5000\n• Net worth unchanged ',
sg: ['ايه هو صافي الثروه؟', 'ازاي اضيف عمليه؟'] },
{ id: 'edit-tx', topic: 'adding', kw: ['اعدل', 'تعديل', 'اغير', 'edit', 'change', 'modify', 'update', 'اصلح'],
ar: 'لتعديل عملية:\n\n• من صفحة العمليات → اضغط على العملية\n• الـ modal يفتح مع البيانات القديمة\n• عدّل واضغط "حفظ"\n\nالرصيد بيتحدّث تلقائيًا.',
en: 'To edit a transaction:\n\n• From Transactions → tap it\n• Modal opens with old data\n• Change and click "Save"\n\nBalance updates automatically.',
sg: ['ازاي احذف عمليه؟', 'ازاي اضيف عمليه؟'] },
{ id: 'delete-tx', topic: 'adding', kw: ['احذف', 'امسح', 'حذف', 'delete', 'remove', 'الغي', 'شيل'],
ar: 'لحذف عملية:\n\n• من صفحة العمليات → عدّي عليها بالماوس → زرار الحذف\n• أو اضغط عليها → من الـ modal → "حذف"\n\nهيسألك تأكيد عشان مايحصلش حذف بالغلط.',
en: 'To delete a transaction:\n\n• From Transactions → hover → delete button\n• Or tap it → modal → "Delete"\n\nAsks for confirmation to prevent mistakes.',
sg: ['ازاي اعدل عمليه؟', 'فيه Undo؟'] },
// ─── ACCOUNTS ───
{ id: 'accounts', topic: 'accounts', kw: ['حساب', 'حسابات', 'account', 'accounts', 'بنك', 'كاش', 'فيزا', 'محفظه', 'visa', 'bank', 'cash', 'wallet'],
ar: 'الحسابات بتدعم أنواع كتيرة:\n\n حساب بنكي\n بطاقة خصم\n كريدت كارد (التزام)\n كاش\n محفظة إلكترونية\n توفير\n أخرى\n\nكل حساب بلون وأيقونة، وتقدر تسميه زي ما تحب.',
en: 'Accounts support many types:\n\n Bank\n Debit\n Credit (liability)\n Cash\n Wallet\n Savings\n Other\n\nEach has custom color & icon, name it however you like.',
sg: ['ازاي اضيف حساب؟', 'ازاي اعمل تحويل؟', 'ايه هو صافي الثروه؟'] },
{ id: 'add-account', topic: 'accounts', kw: ['اضيف حساب', 'حساب جديد', 'add account', 'حساب تاني', 'افتح حساب'],
ar: 'لإضافة حساب:\n\n1. صفحة "الحسابات"\n2. اضغط "+ أضف حساب"\n3. اسم الحساب والنوع والرصيد الابتدائي\n4. اختار لون وأيقونة\n\nنصيحة: للكريدت، اكتب الرصيد بالسالب لو عليك فلوس.',
en: 'To add account:\n\n1. "Accounts" page\n2. "+ Add account"\n3. Name, type, starting balance\n4. Pick color & icon\n\nTip: For credit, use negative if you owe money.',
sg: ['ازاي اعمل تحويل؟', 'ايه هو صافي الثروه؟'] },
{ id: 'networth', topic: 'accounts', kw: ['صافي', 'ثروه', 'net worth', 'networth', 'اصول', 'التزامات'],
ar: 'صافي الثروة = الأصول − الالتزامات\n\n الأصول:\n• أرصدة الحسابات الموجبة\n• الفلوس في الأهداف\n• اللي ليك عند الناس\n\n الالتزامات:\n• الكريدت اللي عليك\n• الديون اللي عليك\n\nمختلف عن الكاش المتاح!',
en: 'Net Worth = Assets − Liabilities\n\n Assets:\n• Positive account balances\n• Money in goals\n• Owed to you\n\n Liabilities:\n• Credit owed\n• Debts you owe\n\nDifferent from available cash!',
sg: ['ايه هي الاصول؟', 'ايه هي الالتزامات؟'] },
// ─── GOALS ───
{ id: 'goals', topic: 'goals', kw: ['هدف', 'اهداف', 'goal', 'goals', 'اوفر', 'save', 'saving', 'توفير'],
ar: 'لإنشاء هدف:\n\n1. صفحة "الأهداف"\n2. اضغط "+ أضف هدف"\n3. اكتب الاسم والمبلغ\n4. لو حددت تاريخ، التطبيق يقولك "لازم توفر كام شهريًا"\n\nلما تحط مبلغ، الفلوس بتنتقل من الحساب للهدف. صافي ثروتك ما بيتغيرش.',
en: 'To create a goal:\n\n1. "Goals" page\n2. "+ Add goal"\n3. Name & target amount\n4. If you set a date, app shows required monthly saving\n\nWhen you add money, funds move from account to goal. Net worth unchanged.',
sg: ['ازاي اضيف مبلغ للهدف؟', 'ازاي اسحب من الهدف؟', 'ايه هي milestones؟'] },
{ id: 'goal-add-money', topic: 'goals', kw: ['اضيف للهدف', 'مبلغ للهدف', 'اوفر في الهدف', 'add money', 'contribute', 'احط فلوس في الهدف'],
ar: 'من صفحة الأهداف:\n\n1. اضغط على الهدف\n2. "ضيف مبلغ"\n3. حدد المبلغ والحساب\n4. "حفظ"\n\nالمبلغ بيتخصم من الحساب ويتضاف للهدف. صافي ثروتك ما بيتغيرش.',
en: 'From Goals:\n\n1. Tap the goal\n2. "Add money"\n3. Amount & account\n4. "Save"\n\nDeducted from account, added to goal. Net worth unchanged.',
sg: ['ازاي اسحب من الهدف؟', 'ايه هي الاهداف القريبه؟'] },
// ─── BUDGETS ───
{ id: 'budgets', topic: 'budgets', kw: ['ميزانيه', 'budget', 'حد', 'limit', 'سقف', 'مصروف شهري'],
ar: 'لضبط ميزانية:\n\n1. صفحة "الميزانية"\n2. اضغط "+ حدّد ميزانية"\n3. اختار تصنيف (أكل، مواصلات...)\n4. حدد مبلغ شهري\n\nالتطبيق ينبهك عند 80% و 100% من الحد.',
en: 'To set a budget:\n\n1. "Budgets" page\n2. "+ Set budget"\n3. Choose category\n4. Set monthly limit\n\nWarns at 80% and 100%.',
sg: ['ايه هي التصنيفات؟', 'ازاي اعمل هدف؟'] },
{ id: 'categories', topic: 'budgets', kw: ['تصنيف', 'تصنيفات', 'category', 'categories', 'اكل', 'مواصلات'],
ar: 'التصنيفات الافتراضية:\n\n أكل\n مواصلات\n�� مشتريات\n فواتير\n ترفيه\n صحة\n تعليم\n اشتراكات\n سفر\n عيلة\n◾ أخرى\n\nتقدر تضيف تصنيفات مخصصة من الإعدادات.',
en: 'Default categories:\n\n Food\n Transport\n Shopping\n Bills\n Entertainment\n Health\n Education\n Subscriptions\n Travel\n Family\n◾ Other\n\nCustom categories in Settings.',
sg: ['ازاي احط ميزانيه؟', 'ايه هي مصادر الدخل؟'] },
// ─── COMMITMENTS ───
{ id: 'installments', topic: 'commitments', kw: ['اقساط', 'قسط', 'installment', 'installments', 'تقسيط'],
ar: 'من صفحة "الأقساط":\n\n1. "+ أضف قسط"\n2. الإجمالي وعدد الأقساط\n3. التطبيق يحسبلك القسط الشهري\n\nلما تدوس "سدّد قسط"، هيتسجل مصروف ويتحدّث الباقي.',
en: 'From "Installments":\n\n1. "+ Add installment"\n2. Total & count\n3. App calculates monthly\n\n"Pay installment" logs an expense and updates balance.',
sg: ['ازاي ادفع قسط؟', 'ايه هي الديون؟'] },
{ id: 'debts', topic: 'commitments', kw: ['ديون', 'دين', 'مديونيه', 'debt', 'debts', 'استلفت', 'اخدت سلفه', 'عليا فلوس', 'ليا فلوس'],
ar: 'صفحة "اللي عليك وليك" فيها قسمين:\n\n اللي عليك — لما تستلف\n اللي ليك — لما حد يستلف منك\n\nكل واحد يدعم:\n• دفعات جزئية\n• تاريخ سداد\n• تنبيهات\n• سجل الحركات',
en: '"Debts & Loans" has two sections:\n\n You Owe — when you borrow\n Owed to You — when someone borrows\n\nEach supports:\n• Partial payments\n• Due date\n• Reminders\n• History',
sg: ['ازاي اسدد جزء؟', 'ازاي اضيف دين؟'] },
{ id: 'recurring', topic: 'commitments', kw: ['متكرر', 'متكرره', 'اشتراك', 'recurring', 'subscription', 'شهري', 'netflix', 'spotify', 'نتفليكس'],
ar: 'للمدفوعات المتكررة:\n\n1. صفحة "التقويم"\n2. "+ أضف دفعة متكررة"\n3. الاسم والمبلغ والتكرار\n4. تاريخ الدفعة الجاية\n\nالتطبيق يفكرك في المعاد.',
en: 'For recurring:\n\n1. "Calendar" page\n2. "+ Add recurring"\n3. Name, amount, frequency\n4. Next due date\n\nApp reminds you on time.',
sg: ['ايه هي التنبيهات؟', 'ايه هو التقويم؟'] },
{ id: 'reminders', topic: 'commitments', kw: ['تنبيه', 'تنبيهات', 'reminder', 'reminders', 'فكرني', 'تذكير', 'اشعارات', 'notification'],
ar: 'التنبيهات بتظهر في:\n\n زر الجرس فوق\n صفحة التقويم\n الداشبورد (اللي عليك قريب)\n\nأنواعها:\n• دفعات قريبة (3 أيام، بكره، النهارده)\n• متأخرات\n• تحذيرات ميزانية (80% و 100%)\n• milestones الأهداف\n• الديون',
en: 'Reminders appear in:\n\n Bell icon\n Calendar page\n Dashboard (Coming Up)\n\nTypes:\n• Due soon (3 days, tomorrow, today)\n• Overdue\n• Budget warnings (80% & 100%)\n• Goal milestones\n• Debts',
sg: ['ازاي اضيف تنبيه؟', 'ايه هو التقويم؟'] },
// ─── INSIGHTS & ANALYTICS ───
{ id: 'insights', topic: 'analytics', kw: ['ملاحظات', 'insights', 'نصايح', 'تحليل ذكي', 'بتقول ايه'],
ar: 'الملاحظات الذكية بتتحسب من بياناتك تلقائيًا — بدون AI:\n\n نسبة الادخار\n تغيّر الصرف عن الشهر اللي فات\n أكثر تصنيف بتصرف عليه\n تحذيرات الميزانية\n تقدم الأهداف\n استخدام الكريدت\n الالتزامات القادمة',
en: 'Smart insights computed from your data — no AI:\n\n Savings rate\n Spending change vs last month\n Top spending category\n Budget warnings\n Goal progress\n Credit usage\n Upcoming commitments',
sg: ['ايه هي التحليلات؟', 'ازاي اعمل هدف؟'] },
{ id: 'analytics', topic: 'analytics', kw: ['تحليلات', 'analytics', 'رسوم', 'charts', 'رسم بياني', 'احصائيات'],
ar: 'صفحة "التحليلات" فيها:\n\n Donut chart — الصرف حسب التصنيف\n Bar chart — آخر 6 شهور\n Line chart — آخر 30 يوم\n\nوتقدر تفلتر حسب:\n• تصنيف\n• حساب\n• شهر\n• مصدر دخل\n\nمع متوسطات يومية وشهرية.',
en: '"Analytics" page has:\n\n Donut — spending by category\n Bar — last 6 months\n Line — last 30 days\n\nFilter by:\n• Category\n• Account\n• Month\n• Income source\n\nWith daily & monthly averages.',
sg: ['ايه هي الملاحظات؟', 'ايه هو صافي الثروه؟'] },
// ─── SETTINGS ───
{ id: 'settings', topic: 'settings', kw: ['اعدادات', 'settings', 'ظبط', 'تحكم', 'preferences'],
ar: 'الإعدادات فيها:\n\n الملف الشخصي (اسم + صورة)\n اللغة (عربي / English)\n المظهر (فاتح / غامق / حسب النظام)\n العملة\n التصنيفات\n تصدير واستيراد\n مسح كل البيانات',
en: 'Settings has:\n\n Profile (name + photo)\n Language\n Theme\n Currency\n Categories\n Export & import\n Delete all data',
sg: ['ازاي اغير اللغه؟', 'ازاي اغير المظهر؟'] },
{ id: 'lang', topic: 'settings', kw: ['لغه', 'لغات', 'عربي', 'انجليزي', 'english', 'language', 'مصري'],
ar: 'التطبيق يدعم لغتين:\n\n العربية (عامية مصرية طبيعية)\n English\n\nتغيّرها من:\n• الإعدادات → اللغة\n• أو زر EN/ع في الهيدر (تبديل سريع)',
en: 'App supports 2 languages:\n\n Arabic (Egyptian)\n English\n\nChange from:\n• Settings → Language\n• Or EN/ع button in header',
sg: ['ازاي اغير المظهر؟', 'ايه هي الاعدادات؟'] },
{ id: 'theme', topic: 'settings', kw: ['مظهر', 'ثيم', 'theme', 'dark', 'light', 'غامق', 'فاتح', 'ليلي', 'نهاري'],
ar: '3 أوضاع للمظهر:\n\n غامق (الافتراضي)\n فاتح\n حسب النظام\n\nتغيّرها من:\n• زر في الهيدر (بيلف بين التلاتة)\n• أو الإعدادات → المظهر',
en: '3 theme modes:\n\n Dark (default)\n Light\n System\n\nChange from:\n• Header button (cycles)\n• Or Settings → Appearance',
sg: ['ازاي اغير اللغه؟', 'ايه هي الاعدادات؟'] },
// ─── DATA ───
{ id: 'export', topic: 'data', kw: ['صدر', 'تصدير', 'export', 'backup', 'باكلوب', 'csv', 'json', 'نسخه'],
ar: 'من الإعدادات → "تصدير البيانات":\n\n JSON — نسخة كاملة للاسترجاع\n CSV — جدول تفتحه في Excel\n\nكمان ينفع تستورد JSON من جهاز تاني.',
en: 'From Settings → "Export data":\n\n JSON — full backup for restore\n CSV — table for Excel\n\nAlso can import JSON from another device.',
sg: ['ازاي امسح كل حاجه؟', 'امان؟'] },
{ id: 'delete-all', topic: 'data', kw: ['امسح كل', 'مسح كل', 'delete all', 'reset', 'clear all', 'ابدأ من الاول'],
ar: 'من الإعدادات → "منطقة خطر" → "مسح كل البيانات".\n\n خد بالك — مفيش رجوع بعد المسح!\n\nنصيحة: صدّر JSON الأول كنسخة احتياطية.',
en: 'From Settings → "Danger zone" → "Delete all data".\n\n Warning — no undo!\n\nTip: Export JSON first as backup.',
sg: ['ازاي اصدر بياناتي؟', 'امان؟'] },
// ─── INTERACTION ───
{ id: 'shortcuts', topic: 'interaction', kw: ['اختصارات', 'shortcuts', 'keyboard', 'مفاتيح'],
ar: 'اختصارات لوحة المفاتيح:\n\nK / Ctrl+K → لوحة الأوامر\nN → عملية جديدة\nS → إضافة ذكية\n/ → البحث\nG → الأهداف\nA → الحسابات\nEsc → إغلاق',
en: 'Keyboard shortcuts:\n\nK / Ctrl+K → Command center\nN → New transaction\nS → Smart Add\n/ → Search\nG → Goals\nA → Accounts\nEsc → Close',
sg: ['ايه هو الـ command center؟', 'ازاي ابحث؟'] },
{ id: 'search', topic: 'interaction', kw: ['بحث', 'ابحث', 'search', 'find', 'دور'],
ar: 'البحث موجود في مكانين:\n\n بحث سريع — Ctrl+K أو K\n بحث العمليات — صفحة العمليات\n\nيدور على:\n• ملاحظات\n• تصنيفات\n• حسابات\n• مبالغ\n• تواريخ',
en: 'Search in two places:\n\n Quick — Ctrl+K or K\n Transactions — in page\n\nSearches:\n• Notes\n• Categories\n• Accounts\n• Amounts\n• Dates',
sg: ['ايه هي الاختصارات؟', 'ايه هو الـ command center؟'] },
{ id: 'mobile', topic: 'interaction', kw: ['موبايل', 'mobile', 'phone', 'تليفون', 'اندرويد', 'ايفون', 'android', 'ios'],
ar: 'التطبيق mobile-first — شغال تمام على الموبايل:\n\n شريط سفلي بـ 5 أزرار\n زر FAB في النص\n الرسوم responsive\n أهداف لمس كبيرة',
en: 'App is mobile-first:\n\n Bottom nav with 5 tabs\n FAB in center\n Responsive charts\n Large touch targets',
sg: ['ايه المميزات؟', 'ازاي اضيف عمليه؟'] },
{ id: 'tips', topic: 'tips', kw: ['نصيحه', 'نصايح', 'tips', 'advice', 'اوفر اكتر', 'ازاي اوفر'],
ar: 'نصايح سريعة:\n\n1. حدد ميزانية لكل تصنيف مهم\n2. راجع الملاحظات الذكية أسبوعيًا\n3. فعّل تنبيهات الفواتير المتكررة\n4. حدد أهداف واضحة بمواعيد\n5. سجّل العمليات فورًا\n\nكل ده بيخليك واعي أكتر.',
en: 'Quick tips:\n\n1. Set budgets for key categories\n2. Review insights weekly\n3. Enable recurring reminders\n4. Set clear goals with dates\n5. Log transactions immediately\n\nAwareness is everything.',
sg: ['ايه هي الملاحظات؟', 'ازاي اعمل هدف؟'] },
];
// Build inverse index for faster scoring
const KB_INDEX = {};
for (const item of KB) {
for (const kw of item.kw) {
const n = normalize(kw);
if (!KB_INDEX[n]) KB_INDEX[n] = [];
KB_INDEX[n].push(item.id);
}
}
// ═══════════════════════════════════════════════════════════════
// 8. INTENT DETECTION
// ═══════════════════════════════════════════════════════════════
function detectIntent(text) {
const n = normalize(text);
if (!n) return 'empty';
// Simple intents
if (/^(hi|hey|hello|sup|اهلا|هاي|سلام عليكم|السلام عليكم|صباح الخير|مساء الخير|صباح|مساء|ازيك|ازيك يا|اخبارك|عامل ايه|عامل ايه يا)/.test(n)) return 'greeting';
if (/^(thanks|thank you|thx|شكرا|متشكر|تسلم|ربنا يخليك|جزاك الله)/.test(n)) return 'thanks';
if (/^(bye|goodbye|see ya|سلام|باي|الى اللقاء|تصبح علي خير|يوم سعيد)/.test(n)) return 'bye';
if (/^(ok|okay|تمام|ماشي|حسنا|طيب)$/.test(n)) return 'ack';
if (/^(yes|yeah|yep|ايوة|ايوه|اجل|نعم|اكيد|طبعا)$/.test(n)) return 'yes';
if (/^(no|nope|لا|مش|مفيش)$/.test(n)) return 'no';
// Question types
if (/(ازاي|كيف|how|طريقه|طريقة|ازاى)/.test(n)) return 'how';
if (/(ايه|ايش|شنو|what|يعني|معني)/.test(n)) return 'what';
if (/(ليه|لماذا|why|سبب|علشان ايه)/.test(n)) return 'why';
if (/(ممكن|اقدر|ينفع|can i|may i|is it possible)/.test(n)) return 'can';
if (/(امتي|متى|when|وقت ايه)/.test(n)) return 'when';
if (/(فين|وين|where|مكان)/.test(n)) return 'where';
if (/(مين|من|who)/.test(n)) return 'who';
return 'info';
}
// ═══════════════════════════════════════════════════════════════
// 9. SCORING with TF-IDF-like weighting
// ═══════════════════════════════════════════════════════════════
function scoreItem(item, tokens, expanded, normalizedText) {
let score = 0;
const matchedKws = new Set();
for (const kw of item.kw) {
const nkw = normalize(kw);
if (!nkw) continue;
// Direct phrase match in full text (highest signal)
if (normalizedText.includes(nkw)) {
score += nkw.length * 5;
matchedKws.add(nkw);
continue;
}
// Token-level matching
for (const tok of tokens) {
// Exact match
if (tok === nkw) {
score += nkw.length * 4;
matchedKws.add(nkw);
break;
}
// Stemmed match
if (stem(tok) === stem(nkw) && nkw.length >= 3) {
score += nkw.length * 3;
matchedKws.add(nkw);
break;
}
// Fuzzy match
const sim = fuzzy(tok, nkw);
if (sim >= 0.6) {
score += sim * nkw.length * 2;
matchedKws.add(nkw);
break;
}
}
// Synonym expansion match
for (const exp of expanded) {
if (exp === nkw || stem(exp) === stem(nkw)) {
score += nkw.length * 1.5;
matchedKws.add(nkw);
break;
}
}
}
// Coverage bonus: how many distinct keywords matched
score += matchedKws.size * 8;
return score;
}
// ═══════════════════════════════════════════════════════════════
// 10. FOLLOW-UP HANDLING
// ═══════════════════════════════════════════════════════════════
function isFollowUp(text) {
const n = normalize(text);
return /^(و|and|more|اكتر|زياده|كمان|برضه|طب|طيب|وبعدين|then|what about|وعن|وماذا عن)/.test(n)
|| /^(ليه|why|ازاي|how)\s*\??$/.test(n)
|| /^(مثال|example|وضح|اشرح|explain|tell me more|فهمني)/.test(n);
}
// ═══════════════════════════════════════════════════════════════
// 11. EXTRACT USER ENTITIES
// ═══════════════════════════════════════════════════════════════
function extractEntities(text, state) {
if (!state) return { accounts: [], categories: [], amounts: [] };
const n = normalize(text);
const result = { accounts: [], categories: [], amounts: [] };
for (const acc of state.accounts || []) {
const names = [acc.name?.ar, acc.name?.en].filter(Boolean);
for (const nm of names) {
const nn = normalize(nm);
if (nn.length > 2 && n.includes(nn)) {
result.accounts.push(acc);
break;
}
}
}
for (const cat of state.categories || []) {
const names = [cat.ar, cat.en].filter(Boolean);
for (const nm of names) {
const nn = normalize(nm);
if (nn.length > 2 && n.includes(nn)) {
result.categories.push(cat);
break;
}
}
}
const amountMatches = text.match(/(\d+(?:[.,]\d{1,2})?)/g);
if (amountMatches) result.amounts = amountMatches.map((x) => parseFloat(x.replace(',', '')));
return result;
}
// ═══════════════════════════════════════════════════════════════
// 12. SPECIAL INTENT RESPONSES
// ═══════════════════════════════════════════════════════════════
const SPECIAL = {
greeting: {
ar: 'أهلاً بيك! \nأنا مساعد الحصالة. اسألني أي حاجة عن التطبيق.',
en: 'Hi there! \nI am the El-Hasala assistant. Ask me anything about the app.',
},
thanks: {
ar: 'العفو! \nلو عندك أي سؤال تاني، أنا هنا.',
en: 'You are welcome! \nI am here if you have more questions.',
},
bye: {
ar: 'سلام! \nلو احتجت حاجة، أنا هنا.',
en: 'Bye! \nI will be here when you need me.',
},
ack: {
ar: 'تمام! \nعندك سؤال تاني؟',
en: 'Got it! \nMore questions?',
},
};
// ═══════════════════════════════════════════════════════════════
// 13. MAIN ASK FUNCTION
// ═══════════════════════════════════════════════════════════════
export function ask(text, options = {}) {
const {
lang = 'ar',
state = null,
history = [],
lastTopicId = null,
} = options;
if (!text ||!text.trim()) {
return {
text: lang === 'ar' ? 'اكتب سؤالك وأنا هساعدك ': 'Type your question and I will help ',
suggestions: [],
topicId: null,
confidence: 0,
};
}
// 1. Intent
const intent = detectIntent(text);
if (SPECIAL[intent]) {
const sg = intent === 'greeting'
? (lang === 'ar' ? ['ايه المميزات؟', 'ازاي ابدأ؟', 'مجاني؟']: ['Features?', 'How to start?', 'Free?'])
: (lang === 'ar' ? ['ايه المميزات؟', 'ازاي اضيف عمليه؟']: ['Features?', 'How to add?']);
return { text: SPECIAL[intent][lang], suggestions: sg, topicId: null, confidence: 1, intent };
}
// 2. Follow-up — re-use last topic
if (isFollowUp(text) && lastTopicId) {
const lastTopic = KB.find((k) => k.id === lastTopicId);
if (lastTopic) {
const extra = buildFollowUpExtra(lastTopic, lang);
return {
text: extra,
suggestions: (lastTopic.sg || []).slice(0, 3),
topicId: lastTopic.id,
confidence: 0.9,
intent: 'followup',
};
}
}
// 3. Tokenize + expand
const tokens = tokenize(text).filter((w) =>!isStop(w) && w.length >= 2);
const expanded = expandSynonyms(tokens);
const normalizedText = normalize(text);
// 4. Score
const scored = KB.map((item) => ({
item,
score: scoreItem(item, tokens, expanded, normalizedText),
})).sort((a, b) => b.score - a.score);
const top = scored[0];
const second = scored[1];
// 5. Confidence
const MIN_SCORE = 6;
if (!top || top.score < MIN_SCORE) {
return buildFallback(text, lang, lastTopicId, history);
}
// 6. Ambiguity — top and second very close
if (second && top.score > 0 && second.score / top.score > 0.8) {
const topicA = top.item;
const topicB = second.item;
return {
text: lang === 'ar'
? `مش متأكد أرد على إيه بالظبط. تقصد:\n\n1⃣ ${topicA.kw[0]}\n2⃣ ${topicB.kw[0]}\n\nاختار أو اكتب تاني.`
: `Not sure what you mean exactly. Did you mean:\n\n1⃣ ${topicA.kw[0]}\n2⃣ ${topicB.kw[0]}\n\nPick one or retype.`,
suggestions: [topicA.kw[0], topicB.kw[0]],
topicId: null,
confidence: 0.5,
};
}
// 7. Personalization
let answer = top.item[lang];
const entities = extractEntities(text, state);
if (entities.accounts.length > 0 &&!answer.includes(entities.accounts[0].name[lang])) {
const accName = entities.accounts[0].name[lang];
answer += lang === 'ar'
? `\n\n لقيتك ذكرت "${accName}" — تقدر تختاره من قائمة الحسابات.`
: `\n\n I see you mentioned "${accName}" — you can pick it from Accounts.`;
}
if (entities.amounts.length > 0 && /اضف|اضيف|add|ضيف/i.test(text)) {
const amt = entities.amounts[0];
answer += lang === 'ar'
? `\n\n المبلغ اللي ذكرته (${amt}) جاهز — اختار تصنيف وحساب واضغط حفظ.`
: `\n\n The amount you mentioned (${amt}) is ready — pick a category & account and save.`;
}
// 8. Suggestions (avoid repeats)
const lastSgs = history.slice(-3).flatMap((h) => h.suggestions || []);
const suggestions = (top.item.sg || []).filter((s) =>!lastSgs.includes(s)).slice(0, 3);
return {
text: answer,
suggestions,
topicId: top.item.id,
topic: top.item.topic,
confidence: Math.min(1, top.score / 25),
intent,
};
}
// ═══════════════════════════════════════════════════════════════
// 14. FOLLOW-UP EXTRA
// ═══════════════════════════════════════════════════════════════
function buildFollowUpExtra(topic, lang) {
const extras = {
'add-tx': {
ar: 'تفاصيل إضافية عن الإضافة:\n\n• التاريخ افتراضيًا النهارده — تقدر تغيره\n• الملاحظة اختيارية\n• التحويل لازم حسابين مختلفين\n• القيم بتتحفظ تلقائيًا',
en: 'Extra details:\n\n• Date defaults to today — you can change it\n• Note is optional\n• Transfer requires two different accounts\n• Values save automatically',
},
'smart-add': {
ar: 'أمثلة تانية للإضافة الذكية:\n\n "صرفت 50 مواصلات من فودافون"\n "دفعت 800 إيجار من البنك"\n "قبضت 3000 فريلانس امبارح"\n\nكل واحد هيتفهم تلقائيًا!',
en: 'More Smart Add examples:\n\n "Spent 50 transport from Vodafone"\n "Paid 800 rent from bank"\n "Received 3000 freelance yesterday"\n\nAll understood automatically!',
},
'goals': {
ar: 'تفاصيل عن الأهداف:\n\n• أهداف قصيرة المدى (أقل من 3 شهور)\n• أهداف طويلة المدى\n• التطبيق يحتفل عند 25% و 50% و 75% و 100%\n• صافي ثروتك ما بيتغيرش لما تحط فلوس في هدف',
en: 'Goal details:\n\n• Short-term (less than 3 months)\n• Long-term goals\n• App celebrates at 25%, 50%, 75%, 100%\n• Net worth unchanged when you add money',
},
'budgets': {
ar: 'تفاصيل الميزانية:\n\n• تنبيه عند 80% و 100%\n• إعادة الضبط تلقائيًا كل شهر\n• تقدر تعملها لكل تصنيف\n• يظهرلك تقدمك في الداشبورد',
en: 'Budget details:\n\n• Alerts at 80% & 100%\n• Auto-resets monthly\n• Set for any category\n• Progress shown on Dashboard',
},
'security': {
ar: 'تفاصيل الأمان أكتر:\n\n• كل حاجة Local Storage في متصفحك\n• مفيش Cookies من طرف تالت\n• مفيش Analytics خارجي\n• مفيش إعلانات',
en: 'More security details:\n\n• Everything in browser LocalStorage\n• No third-party cookies\n• No external analytics\n• No ads',
},
'features': {
ar: 'تعرف كمان إن فيه:\n\n اختصارات: Ctrl+K للأوامر، N لعملية\n مرفقات فواتير (جاي قريب)\n بحث شامل\n وضع ليلي كامل',
en: 'You should also know:\n\n Shortcuts: Ctrl+K for commands, N for new\n�� Receipt attachments (coming)\n Global search\n Full dark mode',
},
};
if (extras[topic.id]) return extras[topic.id][lang];
const fallback = {
ar: `تفاصيل إضافية عن "${topic.kw[0]}":\n\nاسأل سؤال أوسع عن الموضوع ده، أو اختار حاجة من اللي تحت.`,
en: `More details on "${topic.kw[0]}":\n\nAsk a broader question, or pick one below.`,
};
return fallback[lang];
}
// ═══════════════════════════════════════════════════════════════
// 15. FALLBACK
// ═══════════════════════════════════════════════════════════════
function buildFallback(text, lang, lastTopicId, history) {
// Related topic suggestion based on last topic
let relatedHint = '';
if (lastTopicId) {
const last = KB.find((k) => k.id === lastTopicId);
if (last) {
relatedHint = lang === 'ar'
? `\n\n(آخر موضوع كنا فيه: ${last.kw[0]})`
: `\n\n(Last topic was: ${last.kw[0]})`;
}
}
// Popular topics as suggestions
const popular = ['features', 'add-tx', 'goals', 'budgets', 'security', 'smart-add'];
const suggestions = popular
.map((id) => KB.find((k) => k.id === id))
.filter(Boolean)
.map((t) => t.kw[0])
.slice(0, 4);
return {
text: lang === 'ar'
? `معلش، مش فاهم سؤالك بالظبط. \n\nجرّب تسأل عن حاجة من دول، أو أعد صياغة السؤال:\n\n${suggestions.map((s) => '• ' + s).join('\n')}${relatedHint}`
: `Sorry, I did not quite get that. \n\nTry asking about one of these, or rephrase:\n\n${suggestions.map((s) => '• ' + s).join('\n')}${relatedHint}`,
suggestions,
topicId: null,
confidence: 0,
fallback: true,
};
}
// ═══════════════════════════════════════════════════════════════
// 16. WELCOME + QUICK CHIPS
// ═══════════════════════════════════════════════════════════════
export function getWelcome(lang) {
return {
ar: 'أهلاً! \nأنا مساعد الحصالة. اسألني أي حاجة عن التطبيق — بالعربي أو الإنجليزي، وبأي طريقة تكتبها.\n\nجرّب تسأل عن:',
en: 'Hi! \nI am the El-Hasala assistant. Ask me anything — Arabic or English, any way you write it.\n\nTry asking about:',
sg: {
ar: ['ايه المميزات؟', 'ازاي اضيف عمليه؟', 'امان؟', 'ازاي اعمل هدف؟', 'مجاني؟'],
en: ['Features?', 'How to add?', 'Safe?', 'Create a goal?', 'Free?'],
},
};
}
export function getQuickChips(lang) {
return lang === 'ar'
? ['ايه المميزات؟', 'ازاي اضيف عمليه؟', 'امان؟', 'ازاي اعمل هدف؟', 'نصايح']
: ['Features?', 'How to add?', 'Safe?', 'Create a goal?', 'Tips'];
}