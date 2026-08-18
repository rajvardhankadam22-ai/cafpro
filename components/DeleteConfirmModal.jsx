'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  itemName = 'this item',
  isDeleting = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/70 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-md bg-white dark:bg-[#181310] rounded-3xl border border-red-200/80 dark:border-red-900/60 shadow-2xl p-6 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-espresso-600 dark:text-cafe-400 mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-espresso-900 dark:text-cafe-100">
                &quot;{itemName}&quot;
              </span>
              ? This action will remove the record from Firestore and cannot be reversed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
          >
            Keep Item
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
