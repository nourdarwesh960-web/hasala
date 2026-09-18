import { useEffect } from 'react';
export function useKeyboardShortcuts({ onNewTx, onSmartAdd, onSearch, onCommand, onGoals, onAccounts, onEsc }) {
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (isInput) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          onCommand?.();
        }
        return;
      }
      if (e.key === 'Escape') {
        onEsc?.();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'n') { e.preventDefault(); onNewTx?.(); }
      else if (k === 's') { e.preventDefault(); onSmartAdd?.(); }
      else if (k === '/') { e.preventDefault(); onSearch?.(); }
      else if (k === 'g') { e.preventDefault(); onGoals?.(); }
      else if (k === 'a') { e.preventDefault(); onAccounts?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onNewTx, onSmartAdd, onSearch, onCommand, onGoals, onAccounts, onEsc]);
}