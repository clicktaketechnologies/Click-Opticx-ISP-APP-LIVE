import { useState, useCallback } from 'react';
import { ModalType } from '../components/shared/Modal';

interface ModalConfig {
  title: string;
  type?: ModalType;
  message?: string;
  onConfirm?: () => void | Promise<void>;
  confirmLabel?: string;
  confirmDanger?: boolean;
  cancelLabel?: string;
  maxWidth?: string;
}

interface UseModalReturn {
  isOpen: boolean;
  config: ModalConfig;
  open: (cfg: ModalConfig) => void;
  close: () => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

/**
 * useModal — programmatic modal control hook.
 * Usage:
 *   const modal = useModal();
 *   modal.open({ type: 'danger', title: 'Delete', message: '...', onConfirm: handleDelete, confirmDanger: true });
 *   // then render: <Modal isOpen={modal.isOpen} onClose={modal.close} {...modal.config} isLoading={modal.isLoading} />
 */
export const useModal = (): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({ title: '' });

  const open = useCallback((cfg: ModalConfig) => {
    setConfig(cfg);
    setIsLoading(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  return { isOpen, config, open, close, isLoading, setIsLoading };
};

export default useModal;
