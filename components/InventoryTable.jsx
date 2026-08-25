'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Trash2,
  RefreshCw,
  ArrowUpDown,
  Package,
  X,
  Star,
  Truck,
} from 'lucide-react';
import { formatCurrency, getStockStatus } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function InventoryTable({
  items = [],
  categories = [],
  purchaseOrders = [],
  role = 'manager',
  onEdit,
  onDelete,
  onOpenRestock,
  isLoading = false,
}) {
  const toast = useToast();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
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
      <div className="bg-white dark:bg-[#140F0D] rounded-2xl border border-cafe-200/80 dark:border-espresso-800 p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-cafe-100 dark:bg-espresso-800/60 rounded-xl w-full" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-cafe-50 dark:bg-espresso-900/40 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="bg-white dark:bg-[#140F0D] rounded-2xl border border-cafe-200/80 dark:border-espresso-800 p-12 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-caramel-50 dark:bg-caramel-950/60 text-caramel-600 dark:text-caramel-300 flex items-center justify-center mx-auto mb-3 border border-caramel-200 dark:border-caramel-800/40">
          <Package className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-espresso-950 dark:text-cafe-50">
          Your Inventory Catalogue is Empty
        </h3>
        <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 max-w-sm mx-auto">
          Start building your catalogue by clicking "+ Add New Item" above to add your coffee roasts, dairy, syrups, and café supplies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#140F0D] rounded-2xl border border-cafe-200/80 dark:border-espresso-800 shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cafe-200/70 dark:border-espresso-800/80 bg-cafe-50/50 dark:bg-espresso-900/40 text-[11px] font-bold uppercase tracking-wider text-espresso-500 dark:text-cafe-400 select-none">
              <th
                scope="col"
                onClick={() => handleSort('name')}
                className="py-3.5 px-6 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product & SKU</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('category')}
                className="py-3.5 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('quantity')}
                className="py-3.5 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>In Stock</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              {!isBaristaMode && (
                <>
                  <th
                    scope="col"
                    onClick={() => handleSort('unitPrice')}
                    className="py-3.5 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unit Price</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort('valuation')}
                    className="py-3.5 px-4 cursor-pointer hover:text-caramel-600 dark:hover:text-caramel-400 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Value</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                </>
              )}
              <th scope="col" className="py-3.5 px-4 text-center">Stock Status</th>
              <th scope="col" className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cafe-100 dark:divide-espresso-800/50 text-sm">
            <AnimatePresence initial={false}>
              {sortedItems.map((item) => {
                const statusInfo = getStockStatus(item.quantity, item.reorderLevel);
                const categoryName = categoryMap.get(item.categoryId) || 'General Supplies';
                const totalValue = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                const activePo = purchaseOrders.find(
                  (po) => po.status === 'PENDING_DELIVERY' && (po.items || []).some((i) => i.itemId === item.id || i.sku === item.sku)
                );
                const activePoItem = activePo ? (activePo.items || []).find((i) => i.itemId === item.id || i.sku === item.sku) : null;

                return (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="group hover:bg-cafe-50/40 dark:hover:bg-espresso-900/30 transition-colors"
                  >
                    {/* Product & SKU */}
                    <td className="py-4 px-6 align-middle">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-700 dark:group-hover:text-caramel-400 transition-colors">
                            {item.name}
                          </span>
                          {activePoItem && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300" title={`Pending delivery on ${activePo.poNumber}`}>
                              <Truck className="w-3 h-3" />
                              <span>+{activePoItem.orderedQty} {item.unit} On Order</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-espresso-400 dark:text-cafe-400">
                          <span className="font-mono text-espresso-600 dark:text-cafe-300 font-medium">
                            {item.sku || 'NO-SKU'}
                          </span>

                          {item.packageWeight && (
                            <>
                              <span>•</span>
                              <span>{item.packageWeight} {item.packageWeightUnit || 'kg'}/unit</span>
                            </>
                          )}

                          {item.vendorMappings && item.vendorMappings.length > 0 ? (
                            <>
                              <span>•</span>
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => setActivePopoverItemId(activePopoverItemId === item.id ? null : item.id)}
                                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                  title="Click to view supplier price quotes"
                                >
                                  <span>{item.vendorMappings.length} Suppliers</span>
                                </button>

                                <AnimatePresence>
                                  {activePopoverItemId === item.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      className="absolute left-0 top-full mt-1.5 z-40 w-72 p-3 bg-white dark:bg-[#1C1613] rounded-xl border border-cafe-200 dark:border-espresso-700 shadow-lg space-y-2 text-left"
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
                                            className={`p-2 rounded-lg border text-left text-[11px] ${
                                              vm.isPreferred
                                                ? 'bg-caramel-50/60 dark:bg-caramel-950/40 border-caramel-300 dark:border-caramel-800'
                                                : 'bg-cafe-50/40 dark:bg-espresso-900/40 border-cafe-200/70 dark:border-espresso-800'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="font-bold text-espresso-950 dark:text-cafe-50 truncate">
                                                {vm.vendorName}
                                              </span>
                                              {vm.isPreferred && (
                                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                                  Preferred
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[10px] text-espresso-500 dark:text-cafe-400 truncate">
                                              {vm.vendorItemName || item.name}
                                            </p>
                                            <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-cafe-100 dark:border-espresso-800/60 font-mono">
                                              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                                {formatCurrency(vm.unitPrice)}
                                              </span>
                                              <span className="text-[10px] text-espresso-400">
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
                            </>
                          ) : item.supplier ? (
                            <>
                              <span>•</span>
                              <span className="text-espresso-500 dark:text-cafe-400 truncate max-w-[140px]">
                                {item.supplier}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 align-middle">
                      <span className="text-xs font-medium text-espresso-700 dark:text-cafe-300">
                        {categoryName}
                      </span>
                    </td>

                    {/* Quantity Display Only */}
                    <td className="py-4 px-4 text-center align-middle">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-mono font-bold text-sm text-espresso-950 dark:text-cafe-50 tabular-nums">
                          {item.quantity}{' '}
                          <span className="text-xs font-normal text-espresso-400 dark:text-cafe-400">
                            {item.unit}
                          </span>
                        </span>
                        {item.packageWeight && (
                          <span className="text-[10px] text-espresso-400 font-mono mt-0.5">
                            ≈ {((Number(item.quantity) || 0) * (Number(item.packageWeight) || 1.0)).toFixed(1)} {item.packageWeightUnit || 'kg'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Unit Price & Total Value (Hidden in Barista Mode) */}
                    {!isBaristaMode && (
                      <>
                        <td className="py-4 px-4 text-right align-middle font-mono text-xs text-espresso-700 dark:text-cafe-300 tabular-nums">
                          {formatCurrency(Number(item.unitPrice) || 0)}
                        </td>
                        <td className="py-4 px-4 text-right align-middle font-mono text-sm font-semibold text-espresso-950 dark:text-cafe-50 tabular-nums">
                          {formatCurrency(totalValue)}
                        </td>
                      </>
                    )}

                    {/* Stock Status Badge */}
                    <td className="py-4 px-4 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenRestock(item)}
                          className="p-1.5 rounded-lg text-espresso-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Quick Restock"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {!isBaristaMode && (
                          <>
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 rounded-lg text-espresso-400 hover:text-caramel-600 hover:bg-caramel-50 dark:hover:bg-espresso-800 transition-colors"
                              title="Edit Item & Quantity"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(item)}
                              className="p-1.5 rounded-lg text-espresso-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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

      {/* Mobile Card List View */}
      <div className="lg:hidden divide-y divide-cafe-100 dark:divide-espresso-800/60 p-3 space-y-3">
        <AnimatePresence initial={false}>
          {sortedItems.map((item) => {
            const statusInfo = getStockStatus(item.quantity, item.reorderLevel);
            const categoryName = categoryMap.get(item.categoryId) || 'General Supplies';
            const totalValue = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

            return (
              <motion.div
                key={item.id}
                layout
                className="p-4 space-y-3 bg-white dark:bg-[#140F0D] rounded-xl border border-cafe-200/70 dark:border-espresso-800/70 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-espresso-950 dark:text-cafe-50 text-sm">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-espresso-400 dark:text-cafe-400 font-mono">
                      <span>{item.sku || 'NO-SKU'}</span>
                      <span>•</span>
                      <span className="font-sans font-medium text-espresso-600 dark:text-cafe-300">{categoryName}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                    {statusInfo.label}
                  </span>
                </div>

                {!isBaristaMode && (
                  <div className="flex items-center justify-between pt-2 border-t border-cafe-100 dark:border-espresso-800/60 text-xs">
                    <div>
                      <p className="text-[10px] text-espresso-400 uppercase font-semibold">Unit Price</p>
                      <p className="font-mono text-espresso-800 dark:text-cafe-200">
                        {formatCurrency(Number(item.unitPrice) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-espresso-400 uppercase font-semibold">Total Value</p>
                      <p className="font-mono font-semibold text-espresso-950 dark:text-cafe-50">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stock Quantity Display & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-cafe-100 dark:border-espresso-800/60">
                  <div>
                    <p className="text-[10px] text-espresso-400 uppercase font-semibold">In Stock</p>
                    <p className="font-mono font-bold text-sm text-espresso-950 dark:text-cafe-50 tabular-nums">
                      {item.quantity} <span className="text-xs font-normal text-espresso-400">{item.unit}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenRestock(item)}
                      className="p-2 text-espresso-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                      title="Restock"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {!isBaristaMode && (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-espresso-400 hover:text-caramel-600 hover:bg-caramel-50 dark:hover:bg-espresso-800 rounded-lg"
                          title="Edit Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-2 text-espresso-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
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
