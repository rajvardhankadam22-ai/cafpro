'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, Minus, DollarSign, X, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function QuickRestockModal({
  isOpen,
  onClose,
  item,
  onRestock,
}) {
  const [addQty, setAddQty] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const currentQty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const newQty = currentQty + addQty;
  const estimatedCost = addQty * unitPrice;

  const handleQuickAdd = (amount) => {
    setAddQty((prev) => Math.max(1, prev + amount));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (addQty <= 0) return;
    try {
      setIsSubmitting(true);
      await onRestock(item.id, addQty, item.name);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/70 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150"
      >
            <div className="flex items-center justify-between pb-4 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-espresso-900 dark:text-cafe-50">
                    Quick Restock
                  </h3>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400">
                    {item.name} ({item.sku || 'No SKU'})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Current stock status overview */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200/70 dark:border-espresso-800/60 text-center">
                <div>
                  <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">On Hand</p>
                  <p className="text-base font-bold text-espresso-900 dark:text-cafe-100">
                    {currentQty} {item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">Threshold</p>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                    {item.reorderLevel} {item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">New Total</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {newQty} {item.unit}
                  </p>
                </div>
              </div>

              {/* Quantity input & quick buttons */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-2">
                  Units to Add ({item.unit})
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(-5)}
                    className="w-10 h-10 rounded-xl bg-cafe-100 dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 flex items-center justify-center font-bold hover:bg-cafe-200 transition-colors"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 text-center py-2.5 text-lg font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(5)}
                    className="w-10 h-10 rounded-xl bg-cafe-100 dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 flex items-center justify-center font-bold hover:bg-cafe-200 transition-colors"
                  >
                    +5
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 mt-2.5">
                  {[10, 20, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddQty(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        addQty === preset
                          ? 'bg-caramel-100 text-caramel-800 border-caramel-300 dark:bg-caramel-950/60 dark:text-caramel-300 dark:border-caramel-700'
                          : 'bg-white dark:bg-espresso-800/80 text-espresso-600 dark:text-cafe-300 border-cafe-200 dark:border-espresso-700 hover:bg-cafe-50'
                      }`}
                    >
                      +{preset} {item.unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Estimated Cost */}
              <div className="p-3.5 rounded-2xl bg-caramel-50/60 dark:bg-caramel-950/30 border border-caramel-200 dark:border-caramel-800/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-caramel-900 dark:text-caramel-200">
                    Estimated Batch Cost
                  </p>
                  <p className="text-[11px] text-caramel-700 dark:text-caramel-400">
                    {addQty} {item.unit} × {formatCurrency(unitPrice)}
                  </p>
                </div>
                <p className="text-base font-extrabold text-caramel-900 dark:text-caramel-100">
                  {formatCurrency(estimatedCost)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || addQty <= 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Restocking...' : `Confirm +${addQty} ${item.unit}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
