'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  toast: {
    success: (msg, title) => {},
    error: (msg, title) => {},
    warning: (msg, title) => {},
    info: (msg, title) => {},
  },
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title) => {
    const safeMessage =
      typeof message === 'string'
        ? message
        : message?.message
        ? String(message.message)
        : message !== null && message !== undefined
        ? String(message)
        : 'Action completed';

    const safeTitle = typeof title === 'string' ? title : 'Notification';

    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message: safeMessage, title: safeTitle }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title = 'Success') => addToast('success', message, title),
    error: (message, title = 'Error') => addToast('error', message, title),
    warning: (message, title = 'Attention') => addToast('warning', message, title),
    info: (message, title = 'Notice') => addToast('info', message, title),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((item) => (
            <ToastItem key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ item, onDismiss }) {
  const config = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-200 dark:border-emerald-800/70',
      bg: 'bg-emerald-50/95 dark:bg-[#11241A]/95',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      titleColor: 'text-emerald-950 dark:text-emerald-200',
      textColor: 'text-emerald-800 dark:text-emerald-300',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-200 dark:border-amber-800/70',
      bg: 'bg-amber-50/95 dark:bg-[#261E10]/95',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-950 dark:text-amber-200',
      textColor: 'text-amber-800 dark:text-amber-300',
    },
    error: {
      icon: AlertCircle,
      border: 'border-red-200 dark:border-red-800/70',
      bg: 'bg-red-50/95 dark:bg-[#2B1313]/95',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-950 dark:text-red-200',
      textColor: 'text-red-800 dark:text-red-300',
    },
    info: {
      icon: Info,
      border: 'border-caramel-200 dark:border-caramel-800/70',
      bg: 'bg-cafe-50/95 dark:bg-[#201812]/95',
      iconColor: 'text-caramel-600 dark:text-caramel-400',
      titleColor: 'text-espresso-950 dark:text-cafe-100',
      textColor: 'text-espresso-700 dark:text-cafe-300',
    },
  }[item.type] || {};

  const Icon = config.icon || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -15, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-cafe-lg ${config.bg} ${config.border}`}
    >
      <div className={`p-1 rounded-lg shrink-0 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h4 className={`text-sm font-semibold tracking-tight ${config.titleColor}`}>
            {item.title}
          </h4>
        )}
        <p className={`text-xs mt-0.5 leading-relaxed ${config.textColor}`}>
          {item.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200 p-1 rounded-md transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
