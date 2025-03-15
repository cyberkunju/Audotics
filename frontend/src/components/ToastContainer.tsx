'use client';

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import Toast, { ToastType } from './Toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Create a toast context to be used throughout the application
export const ToastContext = React.createContext<{
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}>({
  showToast: () => {},
  hideToast: () => {},
});

// Export for usage in other components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Generate a unique ID for each toast
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }, []);
  
  // Show a new toast
  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = generateId();
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
        duration,
      },
    ]);

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  hideToast: (id: string) => void;
}> = ({ toasts, hideToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} hideToast={hideToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastProps {
  toast: ToastMessage;
  hideToast: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, hideToast }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        hideToast(toast.id);
      }, toast.duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [toast, hideToast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${getToastColor(
        toast.type
      )}`}
    >
      {getToastIcon(toast.type)}
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => hideToast(toast.id)}
        className="ml-2 rounded-full p-1 hover:bg-black/10 transition-colors"
      >
        <FiX className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

const getToastColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200';
  }
};

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <FiCheck className="h-5 w-5 text-green-500" />;
    case 'error':
      return <FiAlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <FiAlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'info':
    default:
      return <FiInfo className="h-5 w-5 text-blue-500" />;
  }
};

export default ToastContainer; 