import React, { useEffect, useRef, useCallback } from 'react';
import {
  X, CheckCircle, AlertTriangle, XCircle, Info, Loader2, Trash2, Shield
} from 'lucide-react';

export type ModalType = 'confirm' | 'success' | 'error' | 'form' | 'info' | 'danger';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: ModalType;
  icon?: React.ReactNode;
  message?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  // Confirm shortcut props
  onConfirm?: () => void | Promise<void>;
  confirmLabel?: string;
  confirmDanger?: boolean;
  cancelLabel?: string;
  isLoading?: boolean;
  maxWidth?: string;
  hideCloseButton?: boolean;
  scrollable?: boolean;
  headerRightContent?: React.ReactNode;
  noPadding?: boolean;
}

const TYPE_CONFIG: Record<ModalType, { icon: React.ReactNode; accent: string }> = {
  confirm: {
    icon: <AlertTriangle size={22} className="text-amber-400" />,
    accent: 'text-amber-400',
  },
  danger: {
    icon: <Trash2 size={22} className="text-rose-400" />,
    accent: 'text-rose-400',
  },
  success: {
    icon: <CheckCircle size={22} className="text-emerald-400" />,
    accent: 'text-emerald-400',
  },
  error: {
    icon: <XCircle size={22} className="text-rose-400" />,
    accent: 'text-rose-400',
  },
  info: {
    icon: <Info size={22} className="text-blue-400" />,
    accent: 'text-blue-400',
  },
  form: {
    icon: <Shield size={22} className="text-blue-400" />,
    accent: 'text-blue-400',
  },
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  type = 'form',
  icon,
  message,
  children,
  footer,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  cancelLabel = 'Cancel',
  isLoading = false,
  maxWidth = 'max-w-lg',
  hideCloseButton = false,
  scrollable = false,
  headerRightContent,
  noPadding = false,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleConfirm = useCallback(async () => {
    if (onConfirm) await onConfirm();
  }, [onConfirm]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = TYPE_CONFIG[type];
  const displayIcon = icon ?? config.icon;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isLoading) onClose();
  };

  const showDefaultFooter = !footer && (onConfirm || type === 'confirm' || type === 'danger');

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4 transition-all duration-300"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} rounded-2xl flex flex-col shadow-2xl transition-all duration-200`}
        style={{
          background: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxHeight: '90vh',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center gap-3">
            {displayIcon}
            <h2 className="text-sm font-black uppercase tracking-widest text-[#0F172A] leading-none">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {headerRightContent}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div
          className={`${noPadding ? '' : 'px-6 py-5'} ${scrollable ? 'overflow-y-auto custom-scrollbar' : ''} flex-1`}
          style={{ minHeight: 0 }}
        >
          {message && (
            <p className="text-sm text-[#475569] leading-relaxed mb-4">{message}</p>
          )}
          {children}
        </div>

        {/* FOOTER */}
        {(footer || showDefaultFooter) && (
          <div
            className="px-6 py-5 flex items-center justify-end gap-3 shrink-0"
            style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
          >
            {footer ? (
              footer
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-[#475569] hover:bg-slate-50 transition-all disabled:opacity-30 border border-slate-200"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                    confirmDanger || type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-900/30'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/30'
                  }`}
                  style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Global animation style injected inline once */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Modal;
