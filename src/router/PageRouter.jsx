import { useApp } from '../context/AppContext';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { AccountsPage } from '../pages/AccountsPage';
import { GoalsPage } from '../pages/GoalsPage';
import { BudgetsPage } from '../pages/BudgetsPage';
import { DebtsPage } from '../pages/DebtsPage';
import { CalendarPage } from '../pages/CalendarPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { InstallmentsPage } from '../pages/InstallmentsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { InsightsPage } from '../pages/InsightsPage';
export function PageRouter() {
  const { page } = useApp();
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'transactions': return <TransactionsPage />;
    case 'accounts': return <AccountsPage />;
    case 'goals': return <GoalsPage />;
    case 'budgets': return <BudgetsPage />;
    case 'installments': return <InstallmentsPage />;
    case 'debts': return <DebtsPage />;
    case 'calendar': return <CalendarPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'insights': return <InsightsPage />;
    case 'settings': return <SettingsPage />;
    case 'more': return <DashboardPage />;
    default: return <DashboardPage />;
  }
}