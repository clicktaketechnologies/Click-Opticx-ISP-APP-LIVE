import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
}

/**
 * ConfirmDialog — thin wrapper around Modal for delete/approve/block patterns.
 * Usage:
 *   <ConfirmDialog
 *     isOpen={showDelete}
 *     title="Delete User"
 *     message="This action is permanent and cannot be undone."
 *     confirmLabel="Delete"
 *     danger
 *     onConfirm={handleDelete}
 *     onClose={() => setShowDelete(false)}
 *     isLoading={isDeleting}
 *   />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={danger ? 'danger' : 'confirm'}
      icon={danger ? <Trash2 size={20} className="text-rose-400" /> : <AlertTriangle size={20} className="text-amber-400" />}
      message={message}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      confirmDanger={danger}
      cancelLabel={cancelLabel}
      isLoading={isLoading}
      maxWidth="max-w-md"
    />
  );
};

export default ConfirmDialog;
