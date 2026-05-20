import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastType) => void;
  toastError: (message: string) => void;
  toastSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_DURATION = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const toastError = useCallback((message: string) => toast(message, 'error'), [toast]);
  const toastSuccess = useCallback((message: string) => toast(message, 'success'), [toast]);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      if (msg && msg !== '认证已过期，请重新登录') {
        toastError(msg);
      }
    };
    window.addEventListener('api:error', handler);
    return () => window.removeEventListener('api:error', handler);
  }, [toastError]);

  const value = React.useMemo(() => ({
    toasts,
    toast,
    toastError,
    toastSuccess,
  }), [toasts, toast, toastError, toastSuccess]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
};

const typeStyles: Record<ToastType, string> = {
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
  info: 'bg-gray-800 text-white',
  warning: 'bg-amber-500 text-white',
};

const typeIcons: Record<ToastType, string> = {
  error: '✕',
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
};

const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm animate-fade-in min-w-[240px] max-w-[420px] ${typeStyles[t.type]}`}
          onClick={() => onDismiss(t.id)}
          role="alert"
        >
          <span className="text-base leading-none opacity-80">{typeIcons[t.type]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
};
