'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Errors/warnings persist longer (8s) so users can read them; success/info auto-dismiss at 3s
        const duration = type === 'error' || type === 'warning' ? 8000 : 3000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                role="status"
                aria-live="polite"
                aria-label="Notifications"
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    pointerEvents: 'none' // Allow clicking through container
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-fade-in"
                        style={{
                            background: 'rgba(30, 41, 59, 0.95)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            minWidth: '300px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            pointerEvents: 'auto', // Re-enable pointer events for toasts
                            color: 'white'
                        }}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500" style={{ color: '#10b981' }} />}
                        {toast.type === 'error' && <AlertTriangle size={20} className="text-red-500" style={{ color: '#ef4444' }} />}
                        {toast.type === 'info' && <Info size={20} className="text-blue-500" style={{ color: '#3b82f6' }} />}

                        <span style={{ fontSize: '0.9rem', flex: 1 }}>{toast.message}</span>

                        <button
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss notification"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
