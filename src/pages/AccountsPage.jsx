import { useApp } from '../context/AppContext';
import { Card, Btn, EmptyState, IconBtn } from '../components/ui';
import { Icon } from '../components/Icon';
import { isLiabilityAcc } from '../lib/finance';
export function AccountsPage() {
const { state, update, t, lang, fmtMoney, totals, setModal, showToast } = useApp();
const del = (acc) => {
setModal({
type: 'confirm',
payload: {
title: t('acc.deleteQ'),
message: t('acc.deleteWarn'),
onConfirm: () => {
update((s) => ({
accounts: s.accounts.filter((a) => a.id !== acc.id),
transactions: s.transactions.filter((x) => x.accountId !== acc.id && x.toAccountId !== acc.id),
recurring: s.recurring.filter((r) => r.accountId !== acc.id),
}));
showToast(lang === 'ar' ? 'اتحذف' : 'Deleted');
},
},
});
};
const assetAccs = state.accounts.filter((a) => !isLiabilityAcc(a));
const liabAccs = state.accounts.filter((a) => isLiabilityAcc(a));
const totalAssets = assetAccs.reduce((s, a) => s + (totals.balances[a.id] || 0), 0);
const totalLiab = liabAccs.reduce((s, a) => s + Math.max(0, -(totals.balances[a.id] || 0)), 0);
return (
<div className="space-y-5 anim-rise">
<div className="flex items-center gap-3">
<h1 className="text-[22px] font-extrabold">{t('acc.title')}</h1>
<div className="grow" />
<Btn size="sm" onClick={() => setModal({ type: 'addAccount' })}>
<Icon name="plus" size={15} sw={2.4} /> {t('acc.add')}
</Btn>
</div>
{state.accounts.length === 0 ? (
<EmptyState icon="" title={t('acc.none')}
action={() => setModal({ type: 'addAccount' })} actionLabel={t('acc.addFirst')} />
) : (
<>
<div className="grid grid-cols-2 gap-3">
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('nw.assets')}</div>
<div className="text-[19px] font-extrabold num text-accent">{fmtMoney(totalAssets)}</div>
</Card>
<Card className="p-4">
<div className="text-[11px] font-semibold text-muted mb-1">{t('nw.liabilities')}</div>
<div className="text-[19px] font-extrabold num text-danger">{fmtMoney(totalLiab)}</div>
</Card>
</div>
{assetAccs.length > 0 && (
<div>
<h2 className="text-[13px] font-bold text-muted mb-2 px-1">{t('nw.assets')}</h2>
<div className="grid sm:grid-cols-2 gap-3">
{assetAccs.map((a) => <AccountCard key={a.id} acc={a} onDelete={() => del(a)} />)}
</div>
</div>
)}
{liabAccs.length > 0 && (
<div>
<h2 className="text-[13px] font-bold text-muted mb-2 px-1">{t('nw.liabilities')}</h2>
<div className="grid sm:grid-cols-2 gap-3">
{liabAccs.map((a) => <AccountCard key={a.id} acc={a} onDelete={() => del(a)} />)}
</div>
</div>
)}
</>
)}
</div>
);
}
function AccountCard({ acc, onDelete }) {
const { state, t, lang, fmtMoney, totals, setModal } = useApp();
const bal = totals.balances[acc.id] || 0;
const isLiab = isLiabilityAcc(acc);
const txCount = state.transactions.filter((x) => x.accountId === acc.id || x.toAccountId === acc.id).length;
return (
<Card className="p-4 group relative overflow-hidden">
<div className="absolute top-0 start-0 w-1 h-full" style={{ background: acc.color }} />
<div className="flex items-start gap-3 ps-2">
<div className="w-10 h-10 rounded-xl grid place-items-center text-[15px] font-bold text-white shrink-0"
style={{ background: acc.color }}>
{acc.name[lang].charAt(0)}
</div>
<div className="min-w-0 grow">
<div className="text-[14px] font-bold truncate">{acc.name[lang]}</div>
<div className="text-[11.5px] text-muted">{t('type.' + acc.type)} · {txCount}</div>
</div>
<div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
<IconBtn name="edit" size={15} onClick={() => setModal({ type: 'editAccount', payload: acc })} />
<IconBtn name="trash" size={15} onClick={onDelete} />
</div>
</div>
<div className="mt-4 ps-2">
<div className={'text-[22px] font-extrabold num ' + (isLiab && bal < 0 ? 'text-danger' : 'text-ink')}>
{fmtMoney(bal)}
</div>
{isLiab && bal < 0 && <div className="text-[11px] text-muted mt-0.5">{t('acc.liability')}</div>}
</div>
</Card>
);
}