import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, TopBar, MobileNav, MoreSheet } from './components/Layout';
import { NotifPanel, GlobalSearch } from './components/Panels';
import { Onboarding } from './components/Onboarding';
import { Landing } from './components/Landing';
import { CommandCenter } from './components/CommandCenter';
import { ChatWidget } from './components/ChatWidget';
import { Tour } from './components/Tour';
import { AuraBackground } from './components/AuraBackground';
import { ModalHost } from './components/modals/ModalHost';
import { Toast } from './components/ui';
import { PageRouter } from './router/PageRouter';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { getSession, logout } from './lib/auth';
import { scheduleSync, loadFromCloud } from './lib/sync';
function Shell() {
  const { state, update, toast, notifOpen, setNotifOpen, searchOpen, setSearchOpen, setModal, setPage } = useApp();
  const [session, setSession] = useState(() => getSession());
  const [authView, setAuthView] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  // ═══ تحميل البيانات من السحابة عند تسجيل الدخول ═══
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      setCloudLoading(true);
      try {
        const result = await loadFromCloud();
        if (cancelled) return;
        if (result.ok && result.data) {
          const d = result.data;
          const cloudHasData =
            (d.transactions?.length || 0) > 0 ||
            (d.accounts?.length || 0) > 0 ||
            (d.goals?.length || 0) > 0;
          if (cloudHasData) {
            // ادمج البيانات السحابية مع المحلية (السحابة هي المصدر لو فيها داتا)
            update((s) => ({
              ...s,
              accounts: d.accounts?.length ? d.accounts : s.accounts,
              transactions: d.transactions?.length ? d.transactions : s.transactions,
              goals: d.goals?.length ? d.goals : s.goals,
              budgets: d.budgets?.length ? d.budgets : s.budgets,
              debts: d.debts?.length ? d.debts : s.debts,
              installments: d.installments?.length ? d.installments : s.installments,
              recurring: d.recurring?.length ? d.recurring : s.recurring,
              reminders: d.reminders?.length ? d.reminders : s.reminders,
              custodies: d.custodies?.length ? d.custodies : s.custodies,
              categories: d.categories?.length ? d.categories : s.categories,
              onboarded: true,
            }));
          }
        }
      } catch (e) {
        console.warn('cloud load failed:', e);
      } finally {
        if (!cancelled) setCloudLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);
  // ═══ مزامنة تلقائية بعد أي تغيير ═══
  useEffect(() => {
    if (!session || !state.onboarded || cloudLoading) return;
    try { scheduleSync(state); } catch (e) { console.warn(e); }
  }, [state, session, cloudLoading]);
  useKeyboardShortcuts({
    onNewTx: () => session && setModal({ type: 'addTx', payload: { type: 'expense' } }),
    onSmartAdd: () => session && setModal({ type: 'smartAdd' }),
    onSearch: () => session && setSearchOpen(true),
    onCommand: () => session && setCommandOpen(true),
    onGoals: () => session && setPage('goals'),
    onAccounts: () => session && setPage('accounts'),
    onEsc: () => { setCommandOpen(false); setSearchOpen(false); },
  });
  const handleLogout = () => {
    logout();
    setSession(null);
    setAuthView(null);
  };
  // ─── Loading من السحابة ───
  if (session && cloudLoading) {
    return (
      <div className="min-h-screen bg-bg text-ink grid place-items-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-accentSoft grid place-items-center">
            <div className="w-8 h-8 rounded-full border-3 border-accent border-t-transparent animate-spin"
              style={{ borderWidth: 3 }} />
          </div>
          <p className="text-[15px] font-bold mb-1">
            {localStorage.getItem('hasala.settings.lang') === 'en' ? 'Loading your data...' : 'بنجيب بياناتك...'}
          </p>
          <p className="text-[12.5px] text-muted">
            {localStorage.getItem('hasala.settings.lang') === 'en' ? 'Syncing with your account' : 'بنزامن مع حسابك'}
          </p>
        </div>
      </div>
    );
  }
  if (authView === 'login') {
    return (
      <LoginPage
        onSuccess={(sess) => { setSession(sess); setAuthView(null); }}
        onSwitchToRegister={() => setAuthView('register')}
        onBack={() => setAuthView(null)}
      />
    );
  }
  if (authView === 'register') {
    return (
      <RegisterPage
        onSuccess={(sess) => { setSession(sess); setAuthView(null); }}
        onSwitchToLogin={() => setAuthView('login')}
        onBack={() => setAuthView(null)}
      />
    );
  }
  if (!session) {
    return (
      <Landing
        isAuthenticated={false}
        onLogin={() => setAuthView('login')}
        onStart={() => setAuthView('register')}
      />
    );
  }
  if (!state.onboarded) {
    return <Onboarding />;
  }
  return (
    <div className="min-h-screen bg-bg text-ink relative">
      <AuraBackground />
      <Sidebar />
      <TopBar onOpenCommand={() => setCommandOpen(true)} onLogout={handleLogout} />
      <main className="lg:ps-[260px] pb-28 lg:pb-10">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8">
          <PageRouter />
        </div>
      </main>
      <MobileNav />
      <MoreSheet />
      <ModalHost />
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
      <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ChatWidget />
      <Tour />
      <Toast toast={toast} />
    </div>
  );
}
export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}