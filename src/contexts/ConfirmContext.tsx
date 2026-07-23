import { createContext, useCallback, useContext, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

type ConfirmOptions = { title: string; message: string; confirmLabel?: string };
type PendingConfirm = ConfirmOptions & { resolve: (confirmed: boolean) => void };
const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export const ConfirmProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setPendingConfirm({ ...options, resolve });
  }), []);
  const finish = (confirmed: boolean) => {
    pendingConfirm?.resolve(confirmed);
    setPendingConfirm(null);
  };
  return <ConfirmContext.Provider value={confirm}>
    {children}
    <ConfirmModal isOpen={pendingConfirm !== null} title={pendingConfirm?.title || ''} message={pendingConfirm?.message || ''} confirmLabel={pendingConfirm?.confirmLabel || 'Confirm'} onCancel={() => finish(false)} onConfirm={() => finish(true)} />
  </ConfirmContext.Provider>;
};

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
};
