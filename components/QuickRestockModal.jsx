'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Plus,
  Minus,
  X,
  Check,
  History,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function QuickRestockModal({
  isOpen,
  onClose,
  item,
  onRestock,
  activityLogs = [],
}) {
  const [activeTab, setActiveTab] = useState('restock'); // 'restock' | 'history'
  const [addQty, setAddQty] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const currentQty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const newQty = currentQty + addQty;
  const estimatedCost = addQty * unitPrice;

  // Filter logs for this specific item
  const itemLogs = (activityLogs || []).filter(
    (log) =>
      (log.itemId && item.id && String(log.itemId) === String(item.id)) ||
      (log.itemName && item.name && log.itemName.toLowerCase() === item.name.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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

  const getBadgeForType = (type) => {
    switch (type) {
      case 'RESTOCKED':
      case 'STOCK_RECEIVED':
        return {
          icon: ArrowUpRight,
          label: 'Restocked',
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        };
      case 'QUANTITY_ADJUSTED':
        return {
          icon: RefreshCw,
          label: 'Quantity Adjusted',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        };
      case 'CREATED':
        return {
          icon: Plus,
          label: 'Item Created',
          className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
        };
      case 'UPDATED':
        return {
          icon: Sparkles,
          label: 'Updated',
          className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        };
      case 'DELETED':
        return {
          icon: ArrowDownLeft,
          label: 'Deleted',
          className: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/60',
        };
      default:
        return {
          icon: Layers,
          label: type || 'Stock Event',
          className: 'bg-cafe-100 text-espresso-800 dark:bg-espresso-800 dark:text-cafe-200 border-cafe-200 dark:border-espresso-700',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/70 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#140F0D] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-cafe-100 dark:border-espresso-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                {item.name}
              </h3>
              <p className="text-xs text-espresso-500 dark:text-cafe-400 font-mono mt-0.5">
                SKU: {item.sku || 'NO-SKU'} • {item.packageWeight ? `${item.packageWeight} ${item.packageWeightUnit || 'kg'}` : item.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-cafe-50 dark:bg-espresso-900/60 rounded-xl border border-cafe-200/60 dark:border-espresso-800 mt-4 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('restock')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'restock'
                ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-xs'
                : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-800 dark:hover:text-cafe-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Quick Restock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-xs'
                : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-800 dark:hover:text-cafe-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Item History ({itemLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Restock Form */}
        {activeTab === 'restock' && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
            {/* Current stock status overview */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-cafe-50/70 dark:bg-espresso-900/40 border border-cafe-200/70 dark:border-espresso-800/60 text-center">
              <div>
                <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">On Hand</p>
                <p className="text-sm sm:text-base font-bold text-espresso-950 dark:text-cafe-100 font-mono">
                  {currentQty} <span className="text-xs font-normal text-espresso-400">{item.unit}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">Threshold</p>
                <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {item.reorderLevel} <span className="text-xs font-normal text-espresso-400">{item.unit}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">New Total</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {newQty} <span className="text-xs font-normal text-emerald-500">{item.unit}</span>
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
                  className="w-10 h-10 rounded-xl bg-cafe-100 dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 flex items-center justify-center font-bold hover:bg-cafe-200 dark:hover:bg-espresso-700 transition-colors"
                >
                  -5
                </button>
                <input
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 0))}
                  className="flex-1 text-center py-2.5 text-lg font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAdd(5)}
                  className="w-10 h-10 rounded-xl bg-cafe-100 dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 flex items-center justify-center font-bold hover:bg-cafe-200 dark:hover:bg-espresso-700 transition-colors"
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      addQty === preset
                        ? 'bg-caramel-100 text-caramel-800 border-caramel-300 dark:bg-caramel-950/60 dark:text-caramel-300 dark:border-caramel-700 font-bold'
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
                <p className="text-[11px] text-caramel-700 dark:text-caramel-400 font-mono">
                  {addQty} {item.unit} × {formatCurrency(unitPrice)}
                </p>
              </div>
              <p className="text-base font-extrabold text-caramel-900 dark:text-caramel-100 font-mono">
                {formatCurrency(estimatedCost)}
              </p>
            </div>

            {/* Quick Recent Activity Snippet */}
            {itemLogs.length > 0 && (
              <div className="pt-2 border-t border-cafe-100 dark:border-espresso-800/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-espresso-500 dark:text-cafe-400 uppercase tracking-wider">
                    Recent Activity
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-[11px] font-bold text-caramel-600 dark:text-caramel-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all ({itemLogs.length})</span>
                    <History className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-cafe-50/50 dark:bg-espresso-900/30 border border-cafe-200/50 dark:border-espresso-800/50 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-espresso-800 dark:text-cafe-200 truncate">
                      {itemLogs[0].detail || itemLogs[0].type}
                    </span>
                  </div>
                  <span className="text-[10px] text-espresso-400 font-mono shrink-0 ml-2">
                    {formatDate(itemLogs[0].timestamp)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || addQty <= 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Restocking...' : `Confirm +${addQty} ${item.unit}`}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Item History & Audit Ledger */}
        {activeTab === 'history' && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 min-h-[260px] max-h-[420px]">
            {itemLogs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-cafe-100 dark:bg-espresso-800 text-espresso-400 dark:text-cafe-400 flex items-center justify-center mx-auto mb-2">
                  <History className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-espresso-950 dark:text-cafe-50">
                  No Past Activity Logged
                </h4>
                <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 max-w-xs mx-auto">
                  No previous restocks or adjustments recorded for {item.name}. All future actions will be tracked chronologically here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('restock')}
                  className="mt-4 px-4 py-2 rounded-xl bg-caramel-50 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800/40 text-xs font-bold hover:bg-caramel-100 transition-colors"
                >
                  Go to Restock
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] text-espresso-400 dark:text-cafe-400 font-medium">
                  Showing all {itemLogs.length} logged events for <strong className="text-espresso-900 dark:text-cafe-100">{item.name}</strong>
                </p>

                {itemLogs.map((log, idx) => {
                  const badge = getBadgeForType(log.type);
                  const Icon = badge.icon;
                  const logDate = log.timestamp ? new Date(log.timestamp) : null;
                  const fullDateStr = logDate && !isNaN(logDate.getTime())
                    ? logDate.toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recorded recently';

                  return (
                    <motion.div
                      key={log.id || `${log.timestamp}-${idx}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-2xl bg-cafe-50/70 dark:bg-espresso-900/40 border border-cafe-200/70 dark:border-espresso-800/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          <span>{badge.label}</span>
                        </span>

                        <div className="flex items-center gap-1 text-[10px] text-espresso-400 font-mono" title={fullDateStr}>
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-espresso-950 dark:text-cafe-100 font-medium leading-relaxed">
                        {log.detail || 'Stock quantity or details updated'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-espresso-400 pt-1 border-t border-cafe-100/80 dark:border-espresso-800/40">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 opacity-60" />
                          <span>{log.user || 'Café Lead'}</span>
                        </span>
                        <span className="font-mono">{fullDateStr}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('restock')}
                className="w-full py-2.5 rounded-xl border border-cafe-200 dark:border-espresso-700 bg-white dark:bg-espresso-800 text-espresso-800 dark:text-cafe-100 font-bold text-xs hover:bg-cafe-50 transition-colors"
              >
                ← Back to Restock Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

