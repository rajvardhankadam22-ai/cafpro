'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  ArrowUpDown,
  MoreVertical,
  AlertTriangle,
  Package,
  Check,
  X,
  Scale,
  Star,
  Building,
  Tag,
} from 'lucide-react';
import { formatCurrency, formatDate, getStockStatus } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function InventoryTable({
  items = [],
  categories = [],
  purchaseOrders = [],
  role = 'manager',
  onEdit,
  onDelete,
  onAdjustQuantity,
  onOpenRestock,
  isLoading = false,
}) {
  const toast = useToast();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [adjustingId, setAdjustingId] = useState(null);
  const [editingQtyId, setEditingQtyId] = useState(null);
  const [tempQty, setTempQty] = useState('');
  const [activePopoverItemId, setActivePopoverItemId] = useState(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const isBaristaMode = role === 'barista';

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStepAmount = (unit) => {
    const u = (unit || '').toLowerCase();
    if (u === 'kg' || u === 'liters' || u === 'l') return 0.5;
    return 1;
  };

  const handleQuickStep = async (id, deltaMultiplier, name, unit) => {
    const step = getStepAmount(unit);
    const actualDelta = deltaMultiplier * step;
    setAdjustingId(id);
    await onAdjustQuantity(id, actualDelta, name);
    setTimeout(() => setAdjustingId(null), 300);
  };

  const handleStartInlineEdit = (item) => {
    setEditingQtyId(item.id);
    setTempQty(String(item.quantity));
  };

  const handleSaveInlineEdit = async (item) => {
    const parsed = parseFloat(tempQty);
    if (isNaN(parsed) || parsed < 0) {
      setEditingQtyId(null);
      return;
    }
    const current = Number(item.quantity) || 0;
    const diff = parsed - current;
    if (diff !== 0) {
      await onAdjustQuantity(item.id, diff, item.name);
      toast.success(`Set ${item.name} stock to ${parsed} ${item.unit}`, 'Stock Updated');
    }
    setEditingQtyId(null);
  };

  const sortedItems = [...items].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'category') {
      aVal = categoryMap.get(a.categoryId) || '';
      bVal = categoryMap.get(b.categoryId) || '';
    } else if (sortField === 'valuation') {
      aVal = (Number(a.quantity) || 0) * (Number(a.unitPrice) || 0);
      bVal = (Number(b.quantity) || 0) * (Number(b.unitPrice) || 0);
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-8 shadow-cafe-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-cafe-100 dark:bg-espresso-800/60 rounded-2xl w-full" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-cafe-50 dark:bg-espresso-900/40 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-12 text-center shadow-cafe-sm">
        <div className="w-16 h-16 rounded-3xl bg-caramel-50 dark:bg-caramel-950/60 text-caramel-600 dark:text-caramel-300 flex items-center justify-center mx-auto mb-4 border border-caramel-200 dark:border-caramel-800/40">
          <Package className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
          Your Inventory Catalogue is Empty
        </h3>
        <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 max-w-sm mx-auto">
          Start building your catalogue by clicking "+ Add Item" above to add your coffee roasts, dairy, syrups, and café supplies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm overflow-hidden transition-colors">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cafe-100 dark:border-espresso-800/80 bg-cafe-50/70 dark:bg-espresso-900/40 text-[11px] font-bold uppercase tracking-wider text-espresso-500 dark:text-cafe-400">
              <th
                onClick={() => handleSort('name')}
                className="py-4 px-6 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product & SKU</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-4 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="py-4 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>{isBaristaMode ? '⚡ High-Speed Stepper' : 'Stock / Stepper'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-4 px-4 text-center">
                <span>PAR Target</span>
              </th>
              {!isBaristaMode && (
                <>
                  <th
                    onClick={() => handleSort('unitPrice')}
                    className="py-4 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Unit Price</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('valuation')}
                    className="py-4 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Total Value</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </>
              )}
              <th className="py-4 px-4">Stock Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cafe-100 dark:divide-espresso-800/60 text-sm">
            <AnimatePresence initial={false}>
              {sortedItems.map((item, index) => {
                const statusInfo = getStockStatus(item.quantity, item.reorderLevel);
                const categoryName = categoryMap.get(item.categoryId) || 'General Supplies';
                const totalValue = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const isAdjusting = adjustingId === item.id;
                const isEditingThisQty = editingQtyId === item.id;
                const step = getStepAmount(item.unit);
                const par = Number(item.parLevel) || (Number(item.reorderLevel || 5) * 2);

                const activePo = purchaseOrders.find(
                  (po) => po.status === 'PENDING_DELIVERY' && (po.items || []).some((i) => i.itemId === item.id || i.sku === item.sku)
                );
                const activePoItem = activePo ? (activePo.items || []).find((i) => i.itemId === item.id || i.sku === item.sku) : null;

                return (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.25) }}
                    className="group hover:bg-cafe-50/50 dark:hover:bg-espresso-900/30 transition-colors"
                  >
                    {/* Product & SKU */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-700 dark:group-hover:text-caramel-400 transition-colors">
                            {item.name}
                          </span>
                          {activePoItem && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse" title={`Pending delivery on ${activePo.poNumber}`}>
                              🚚 +{activePoItem.orderedQty} {item.unit} On Order
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] font-semibold text-espresso-500 dark:text-cafe-400 bg-cafe-100 dark:bg-espresso-800 px-1.5 py-0.5 rounded border border-cafe-200 dark:border-espresso-700">
                            {item.sku || 'NO-SKU'}
                          </span>
                          {item.packageWeight && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-caramel-50 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 border border-caramel-200/50">
                              {item.packageWeight} {item.packageWeightUnit || 'kg'}/unit
                            </span>
                          )}
                          {item.vendorMappings && item.vendorMappings.length > 0 ? (
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setActivePopoverItemId(activePopoverItemId === item.id ? null : item.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Click to view supplier price quotes"
                              >
                                <span>🏷️ {item.vendorMappings.length} Suppliers</span>
                              </button>

                              <AnimatePresence>
                                {activePopoverItemId === item.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    className="absolute left-0 top-full mt-1.5 z-40 w-72 p-3 bg-white dark:bg-[#1C1613] rounded-2xl border border-cafe-200 dark:border-espresso-700 shadow-cafe-lg space-y-2 text-left"
                                  >
                                    <div className="flex items-center justify-between border-b border-cafe-100 dark:border-espresso-800 pb-1.5">
                                      <span className="text-[10px] font-bold uppercase text-espresso-600 dark:text-cafe-400">
                                        Supplier Quotes ({item.vendorMappings.length})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setActivePopoverItemId(null)}
                                        className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                      {item.vendorMappings.map((vm) => (
                                        <div
                                          key={vm.mappingId || vm.vendorName}
                                          className={`p-2 rounded-xl border text-left text-[11px] ${
                                            vm.isPreferred
                                              ? 'bg-caramel-50/80 dark:bg-caramel-950/40 border-caramel-300 dark:border-caramel-800'
                                              : 'bg-cafe-50/50 dark:bg-espresso-900/50 border-cafe-200/70 dark:border-espresso-800'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="font-bold text-espresso-950 dark:text-cafe-50 truncate">
                                              {vm.vendorName}
                                            </span>
                                            {vm.isPreferred && (
                                              <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-0.5">
                                                <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                                                Preferred
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-espresso-500 dark:text-cafe-400 truncate">
                                            Vendor Title: <em>"{vm.vendorItemName || item.name}"</em>
                                          </p>
                                          <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-cafe-100 dark:border-espresso-800/60 font-mono">
                                            <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                                              {formatCurrency(vm.unitPrice)}
                                            </span>
                                            <span className="text-[9px] text-espresso-400">
                                              {vm.leadTimeDays || 2}d lead
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : item.supplier ? (
                            <span className="text-[11px] text-espresso-400 dark:text-cafe-400 truncate max-w-[140px]">
                              • {item.supplier}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-cafe-100 text-espresso-800 dark:bg-espresso-800/90 dark:text-cafe-200 border border-cafe-200/80 dark:border-espresso-700">
                        {categoryName}
                      </span>
                    </td>

                    {/* Quantity with Smart Stepper & Inline Edit */}
                    <td className="py-4 px-4 text-center">
                      {isEditingThisQty ? (
                        <div className="inline-flex items-center gap-1 bg-white dark:bg-espresso-800 p-1 rounded-xl border border-caramel-500 shadow-sm">
                          <input
                            type="number"
                            step={step}
                            min="0"
                            autoFocus
                            value={tempQty}
                            onChange={(e) => setTempQty(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item);
                              if (e.key === 'Escape') setEditingQtyId(null);
                            }}
                            className="w-16 px-1.5 py-0.5 text-xs font-bold text-center bg-transparent text-espresso-950 dark:text-cafe-50 outline-none"
                          />
                          <button
                            onClick={() => handleSaveInlineEdit(item)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingQtyId(null)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 bg-cafe-50 dark:bg-espresso-900/60 p-1 rounded-xl border border-cafe-200 dark:border-espresso-700 ${
                          isBaristaMode ? 'scale-105' : ''
                        }`}>
                          <button
                            onClick={() => handleQuickStep(item.id, -1, item.name, item.unit)}
                            disabled={Number(item.quantity) <= 0}
                            className={`rounded-lg bg-white dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 flex items-center justify-center hover:bg-caramel-50 hover:text-caramel-700 dark:hover:bg-espresso-700 transition-all active:scale-90 disabled:opacity-40 shadow-sm font-bold ${
                              isBaristaMode ? 'w-9 h-9 text-base' : 'w-7 h-7'
                            }`}
                            title={`Decrease ${step} ${item.unit}`}
                          >
                            <Minus className={isBaristaMode ? 'w-4 h-4' : 'w-3 h-3'} />
                          </button>
                          <div className="flex flex-col items-center">
                            <motion.button
                              onClick={() => handleStartInlineEdit(item)}
                              animate={isAdjusting ? { scale: [1, 1.25, 1] } : {}}
                              className={`font-bold text-espresso-950 dark:text-cafe-50 text-center font-mono hover:text-caramel-600 transition-colors px-1 ${
                                isBaristaMode ? 'min-w-[64px] text-sm' : 'min-w-[56px] text-xs'
                              }`}
                              title="Click to type exact number"
                            >
                              {item.quantity} <span className="text-[10px] text-espresso-400 dark:text-cafe-400 font-normal">{item.unit}</span>
                            </motion.button>
                            {item.packageWeight && (
                              <span className="text-[9px] font-semibold text-caramel-700 dark:text-caramel-400">
                                ≈ {((Number(item.quantity) || 0) * (Number(item.packageWeight) || 1.0)).toFixed(1)} {item.packageWeightUnit || 'kg'}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleQuickStep(item.id, 1, item.name, item.unit)}
                            className={`rounded-lg bg-white dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 flex items-center justify-center hover:bg-caramel-50 hover:text-caramel-700 dark:hover:bg-espresso-700 transition-all active:scale-90 shadow-sm font-bold ${
                              isBaristaMode ? 'w-9 h-9 text-base' : 'w-7 h-7'
                            }`}
                            title={`Increase ${step} ${item.unit}`}
                          >
                            <Plus className={isBaristaMode ? 'w-4 h-4' : 'w-3 h-3'} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* PAR Target */}
                    <td className="py-4 px-4 text-center font-semibold text-xs text-espresso-600 dark:text-cafe-300">
                      <span className="px-2 py-0.5 rounded-md bg-cafe-100 dark:bg-espresso-800/80 font-mono">
                        {par} {item.unit}
                      </span>
                    </td>

                    {/* Unit Price & Total Value (Hidden in Barista Mode) */}
                    {!isBaristaMode && (
                      <>
                        <td className="py-4 px-4 font-medium text-espresso-800 dark:text-cafe-200">
                          {formatCurrency(Number(item.unitPrice) || 0)}
                        </td>
                        <td className="py-4 px-4 font-bold text-espresso-950 dark:text-cafe-50">
                          {formatCurrency(totalValue)}
                        </td>
                      </>
                    )}

                    {/* Stock Status Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenRestock(item)}
                          className="p-2 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Quick Restock"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {!isBaristaMode && (
                          <>
                            <button
                              onClick={() => onEdit(item)}
                              className="p-2 rounded-xl text-espresso-500 hover:text-caramel-600 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
                              title="Edit Item"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(item)}
                              className="p-2 rounded-xl text-espresso-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Optimized for High-Speed Touch) */}
      <div className="lg:hidden divide-y divide-cafe-100 dark:divide-espresso-800/60 p-2">
        <AnimatePresence initial={false}>
          {sortedItems.map((item) => {
            const statusInfo = getStockStatus(item.quantity, item.reorderLevel);
            const categoryName = categoryMap.get(item.categoryId) || 'General Supplies';
            const totalValue = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            const par = Number(item.parLevel) || (Number(item.reorderLevel || 5) * 2);

            return (
              <motion.div
                key={item.id}
                layout
                className="p-4 space-y-3 bg-white dark:bg-[#181310] rounded-2xl mb-2 border border-cafe-100 dark:border-espresso-800/50 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-espresso-950 dark:text-cafe-50 text-sm">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] font-semibold text-espresso-500 dark:text-cafe-400 bg-cafe-100 dark:bg-espresso-800 px-1.5 py-0.5 rounded">
                        {item.sku}
                      </span>
                      <span className="text-xs text-espresso-600 dark:text-cafe-300">
                        {categoryName}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                    {statusInfo.label}
                  </span>
                </div>

                {!isBaristaMode && (
                  <div className="flex items-center justify-between pt-2 border-t border-cafe-100 dark:border-espresso-800/60 text-xs">
                    <div>
                      <p className="text-[10px] text-espresso-400 uppercase font-bold">Unit Price</p>
                      <p className="font-semibold text-espresso-900 dark:text-cafe-100">
                        {formatCurrency(Number(item.unitPrice) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-espresso-400 uppercase font-bold">Total Value</p>
                      <p className="font-bold text-espresso-950 dark:text-cafe-50">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-espresso-400 uppercase font-bold">PAR Capacity</p>
                      <p className="font-bold text-espresso-950 dark:text-cafe-50 font-mono">
                        {par} {item.unit}
                      </p>
                    </div>
                  </div>
                )}

                {/* Touch Stepper Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center gap-2 bg-cafe-50 dark:bg-espresso-900/60 p-1.5 rounded-2xl border border-cafe-200 dark:border-espresso-700">
                    <button
                      onClick={() => handleQuickStep(item.id, -1, item.name, item.unit)}
                      disabled={Number(item.quantity) <= 0}
                      className="w-12 h-12 rounded-xl bg-white dark:bg-espresso-800 text-espresso-800 dark:text-cafe-100 flex items-center justify-center font-extrabold text-lg shadow-sm active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="min-w-[60px] font-extrabold text-sm text-center font-mono">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleQuickStep(item.id, 1, item.name, item.unit)}
                      className="w-12 h-12 rounded-xl bg-white dark:bg-espresso-800 text-espresso-800 dark:text-cafe-100 flex items-center justify-center font-extrabold text-lg shadow-sm active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenRestock(item)}
                      className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                      title="Restock"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    {!isBaristaMode && (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-3 text-espresso-500 hover:bg-cafe-100 rounded-xl"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
