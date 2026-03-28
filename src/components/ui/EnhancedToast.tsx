'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X, Undo, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onUndo?: () => void;
  progress?: boolean;
  persistent?: boolean;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  /** Backwards-compatible API matching the old ToastContext */
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  loading: <Loader2 className="w-5 h-5 animate-spin" />,
};

const colors: Record<ToastType, string> = {
  success: 'text-success border-success/20 bg-success/10',
  error: 'text-error border-error/20 bg-error/10',
  warning: 'text-warning border-warning/20 bg-warning/10',
  info: 'text-info border-info/20 bg-info/10',
  loading: 'text-primary border-primary/20 bg-primary/10',
};

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
  index: number;
}

function ToastItem({ toast, onRemove, index }: ToastItemProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.persistent || !toast.duration) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev - 100 / (toast.duration! / 100);
        if (next <= 0) {
          onRemove();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toast, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{ bottom: `${index * 80 + 20}px` }}
      className={cn(
        'fixed right-4 z-50',
        'min-w-[320px] max-w-[420px]',
        'liquid-glass backdrop-blur-xl',
        'border rounded-lg shadow-lg',
        'p-4 pr-12',
        colors[toast.type]
      )}
    >
      {/* Icon and content */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.description && <p className="mt-1 text-xs opacity-90">{toast.description}</p>}

          {/* Actions */}
          {(toast.action || toast.onUndo) && (
            <div className="mt-3 flex gap-2">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action!.onClick();
                    onRemove();
                  }}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    'bg-white/20 hover:bg-white/30',
                    'transition-colors'
                  )}
                >
                  {toast.action.label}
                </button>
              )}
              {toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo!();
                    onRemove();
                  }}
                  className={cn(
                    'inline-flex items-center gap-1',
                    'text-xs font-medium px-2 py-1 rounded',
                    'bg-white/20 hover:bg-white/30',
                    'transition-colors'
                  )}
                >
                  <Undo className="w-3 h-3" />
                  Undo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onRemove}
        className={cn(
          'absolute top-3 right-3',
          'p-1 rounded-md',
          'hover:bg-white/20 transition-colors'
        )}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      {toast.progress && !toast.persistent && toast.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
          <motion.div
            className="h-full bg-current opacity-50"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function EnhancedToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = {
      id,
      duration: 5000,
      progress: true,
      ...toast,
    };

    setToasts(prev => {
      // Limit to 5 toasts max
      const updated = [...prev, newToast];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /** Backwards-compatible wrapper for the old showToast(message, type, action) API */
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', action?: ToastAction) => {
      addToast({
        type,
        title: message,
        ...(action && { action }),
        duration: type === 'error' || type === 'warning' ? 8000 : 3000,
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts, showToast }}>
      {children}
      <AnimatePresence mode="sync">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

// Convenience functions for common toast types
export function useToastActions() {
  const { addToast, removeToast } = useToast();

  return {
    success: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', title, ...options }),

    error: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', title, duration: 7000, ...options }),

    warning: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', title, ...options }),

    info: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', title, ...options }),

    loading: (title: string, options?: Partial<Toast>) =>
      addToast({ type: 'loading', title, persistent: true, ...options }),

    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => {
      const id = addToast({ type: 'loading', title: messages.loading, persistent: true });

      try {
        const data = await promise;
        addToast({
          type: 'success',
          title: typeof messages.success === 'function' ? messages.success(data) : messages.success,
        });
        return data;
      } catch (error) {
        addToast({
          type: 'error',
          title: typeof messages.error === 'function' ? messages.error(error) : messages.error,
        });
        throw error;
      } finally {
        removeToast(id);
      }
    },
  };
}

/** Drop-in replacement alias for the old ToastProvider */
export const ToastProvider = EnhancedToastProvider;
