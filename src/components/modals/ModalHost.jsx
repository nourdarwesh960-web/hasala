import { useApp } from '../../context/AppContext';
import { AddTxModal, QuickAddSheet, SmartAddModal } from './TransactionModals';
import { AccountModal } from './AccountModals';
import { GoalModal, ContributeModal } from './GoalModals';
import { BudgetModal } from './BudgetModals';
import { DebtModal, PayDebtModal } from './DebtModals';
import { RecurringModal, ReminderModal } from './RecurringModals';
import { CategoryModal } from './CategoryModals';
import { ConfirmModal } from './ConfirmModal';
import { InstallmentModal, PayInstallmentModal } from './InstallmentModals';
import { GiveToGoalModal } from './GiveToGoalModal';
export function ModalHost() {
  const { modal, setModal, fabOpen, setFabOpen } = useApp();
  if (fabOpen) return <QuickAddSheet open={true} onClose={() => setFabOpen(false)} />;
  if (!modal) return null;
  const close = () => setModal(null);
  const props = { open: true, onClose: close, payload: modal.payload };
  switch (modal.type) {
    case 'addTx':           return <AddTxModal {...props} />;
    case 'editTx':          return <AddTxModal {...props} edit={modal.payload} />;
    case 'smartAdd':        return <SmartAddModal {...props} />;
    case 'addAccount':      return <AccountModal {...props} />;
    case 'editAccount':     return <AccountModal {...props} edit={modal.payload} />;
    case 'addGoal':         return <GoalModal {...props} />;
    case 'editGoal':        return <GoalModal {...props} edit={modal.payload} />;
    case 'contribute':      return <ContributeModal {...props} />;
    case 'giveToGoal':      return <GiveToGoalModal {...props} />;
    case 'addBudget':       return <BudgetModal {...props} />;
    case 'editBudget':      return <BudgetModal {...props} edit={modal.payload} />;
    case 'addDebt':         return <DebtModal {...props} />;
    case 'editDebt':        return <DebtModal {...props} edit={modal.payload} />;
    case 'payDebt':         return <PayDebtModal {...props} />;
    case 'addRecurring':    return <RecurringModal {...props} />;
    case 'editRecurring':   return <RecurringModal {...props} edit={modal.payload} />;
    case 'addReminder':     return <ReminderModal {...props} />;
    case 'editReminder':    return <ReminderModal {...props} edit={modal.payload} />;
    case 'addCategory':     return <CategoryModal {...props} />;
    case 'editCategory':    return <CategoryModal {...props} edit={modal.payload} />;
    case 'addInstallment':  return <InstallmentModal {...props} />;
    case 'editInstallment': return <InstallmentModal {...props} edit={modal.payload} />;
    case 'payInstallment':  return <PayInstallmentModal {...props} />;
    case 'confirm':         return <ConfirmModal {...props} />;
    default:                return null;
  }
}