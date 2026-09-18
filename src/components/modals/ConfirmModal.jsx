import { useApp } from '../../context/AppContext';
import { Modal, Btn } from '../ui';
export function ConfirmModal({ open, onClose, payload }) {
  const { t } = useApp();
  const { title, message, onConfirm, confirmLabel, danger = true } = payload || {};
  return (
    <Modal open={open} onClose={onClose} title={title || t('common.confirm')} size="sm">
      <p className="text-[14px] text-muted leading-relaxed mb-6">{message}</p>
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">{t('common.cancel')}</Btn>
        <Btn variant={danger ? 'danger' : 'primary'}
          onClick={() => { onConfirm?.(); onClose(); }} className="flex-1">
          {confirmLabel || t('common.delete')}
        </Btn>
      </div>
    </Modal>
  );
}