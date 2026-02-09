import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

const toastIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

const toastColors: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    warning: 'var(--color-warning)',
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, type, message };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}

            {/* Toast Container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    zIndex: 9999,
                    pointerEvents: 'none',
                }}
            >
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.875rem 1.25rem',
                                background: 'rgba(22, 22, 29, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: `1px solid ${toastColors[toast.type]}33`,
                                borderRadius: '0.5rem',
                                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px ${toastColors[toast.type]}20`,
                                pointerEvents: 'auto',
                                cursor: 'pointer',
                                minWidth: '280px',
                                maxWidth: '400px',
                            }}
                            onClick={() => removeToast(toast.id)}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    borderRadius: '50%',
                                    background: `${toastColors[toast.type]}20`,
                                    color: toastColors[toast.type],
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                }}
                            >
                                {toastIcons[toast.type]}
                            </span>
                            <span style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                                {toast.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;
