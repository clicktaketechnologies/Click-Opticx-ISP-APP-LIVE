import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-emerald-400 shrink-0" />,
  error:   <XCircle size={18} className="text-rose-400 shrink-0" />,
  info:    <Info size={18} className="text-blue-400 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-400 shrink-0" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-l-4 border-emerald-500',
  error:   'border-l-4 border-rose-500',
  info:    'border-l-4 border-blue-500',
  warning: 'border-l-4 border-amber-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    timerRef.current[id] = setTimeout(() => dismiss(id), type === 'error' ? 5000 : 3000);
  }, [dismiss]);

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast]);
  const error   = useCallback((t: string, m?: string) => toast('error', t, m), [toast]);
  const info    = useCallback((t: string, m?: string) => toast('info', t, m), [toast]);
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 360 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl ${BORDERS[t.type]}`}
            style={{
              background: '#0F172A',
              animation: 'toastIn 0.25s ease-out',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            {ICONS[t.type]}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-white leading-none">{t.title}</p>
              {t.message && <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-600 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastProvider;
