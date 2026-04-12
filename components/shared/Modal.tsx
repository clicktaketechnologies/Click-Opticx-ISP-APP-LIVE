import React, { useEffect, useRef, useCallback } from 'react';
import {
  X, CheckCircle, AlertTriangle, XCircle, Info, Loader2, Trash2, Shield, ArrowRight
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
    icon: <AlertTriangle size={22} className="text-amber-500" />,
    accent: 'text-amber-500',
  },
  danger: {
    icon: <Trash2 size={22} className="text-rose-600" />,
    accent: 'text-rose-600',
  },
  success: {
    icon: <CheckCircle size={22} className="text-emerald-600" />,
    accent: 'text-emerald-600',
  },
  error: {
    icon: <XCircle size={22} className="text-rose-600" />,
    accent: 'text-rose-600',
  },
  info: {
    icon: <Info size={22} className="text-blue-600" />,
    accent: 'text-blue-600',
  },
  form: {
    icon: <Shield size={22} className="text-blue-600" />,
    accent: 'text-blue-600',
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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(6px)' }}
    >
      <div
        ref={modalRef}
        data-modal="true"
        className={`modal relative w-full ${maxWidth} rounded-[2rem] flex flex-col shadow-2xl transition-all duration-200 overflow-hidden bg-white border border-slate-100`}
        style={{
          animation: 'modalIn 0.2s ease-out',
          maxHeight: 'calc(100vh - 2rem)'
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-6 shrink-0 gap-4 border-b border-slate-50"
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              {displayIcon}
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-tight">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {headerRightContent}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:text-white hover:bg-rose-600 transition-all disabled:opacity-30 border border-rose-100 hover:border-transparent shadow-sm"
              >
                <X size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div
          className={`${noPadding ? '' : 'px-5 sm:px-8 py-4 sm:py-6'} overflow-y-auto custom-scrollbar flex-1`}
          style={{ minHeight: 0 }}
        >
          {message && (
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6 italic border-l-2 border-blue-500 pl-4">{message}</p>
          )}
          {children}
        </div>

        {/* FOOTER */}
        {(footer || showDefaultFooter) && (
          <div
            className="px-5 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0 border-t border-slate-50 bg-slate-50/30"
          >
            {footer ? (
              footer
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-30 border border-slate-200 shadow-sm shadow-slate-100"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl ${
                    confirmDanger || type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                  style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Protocol Syncing...
                    </>
                  ) : (
                    <>
                      {confirmLabel}
                      {type === 'confirm' ? <ArrowRight size={14} /> : <CheckCircle size={14} />}
                    </>
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
