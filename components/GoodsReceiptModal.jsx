'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  User,
  DollarSign,
  X,
  Check,
  FileText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function GoodsReceiptModal({
  isOpen,
  onClose,
  purchaseOrder,
  onReconcile,
}) {
  const [itemsState, setItemsState] = useState([]);
  const [receiverName, setReceiverName] = useState('Aarav (Manager)');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (purchaseOrder && purchaseOrder.items) {
      setItemsState(
        purchaseOrder.items.map((item) => ({
          ...item,
          receivedQty: item.orderedQty, // Default to full order
          unitPrice: item.unitPrice,
        }))
      );
    }
  }, [purchaseOrder]);

  if (!purchaseOrder) return null;

  const handleQtyChange = (index, value) => {
    const updated = [...itemsState];
    updated[index].receivedQty = Math.max(0, parseFloat(value) || 0);
    setItemsState(updated);
  };

  const handlePriceChange = (index, value) => {
    const updated = [...itemsState];
    updated[index].unitPrice = Math.max(0, parseFloat(value) || 0);
    setItemsState(updated);
  };

  const totalReconciledCost = itemsState.reduce(
    (acc, curr) => acc + (curr.receivedQty * curr.unitPrice),
    0
  );

  const totalOrderedQty = (purchaseOrder.items || []).reduce((acc, i) => acc + Number(i.orderedQty || 0), 0);
  const totalReceivedQty = itemsState.reduce((acc, i) => acc + Number(i.receivedQty || 0), 0);
  const hasDiscrepancy = totalReceivedQty !== totalOrderedQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onReconcile(purchaseOrder.id, {
        items: itemsState,
        notes: deliveryNotes,
      }, receiverName);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !purchaseOrder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/75 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cafe-100 dark:border-espresso-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                      Goods Receipt & Reconciliation
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-caramel-100 dark:bg-caramel-950/60 text-caramel-800 dark:text-caramel-300 font-bold">
                      {purchaseOrder.poNumber}
                    </span>
                  </div>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400">
                    Vendor: <strong className="text-espresso-800 dark:text-cafe-200">{purchaseOrder.supplierName}</strong>
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

            {/* Content Body */}
            <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Delivery Warning Banner if discrepancy */}
              {hasDiscrepancy && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p>
                    <strong>Shipment Discrepancy:</strong> Receiving {totalReceivedQty} of {totalOrderedQty} ordered units. System will record this as a Partial Delivery.
                  </p>
                </div>
              )}

              {/* Item-by-item reconciliation list */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300">
                  Inspect & Verify Delivered Items
                </label>

                {itemsState.map((item, idx) => {
                  const ordered = Number(item.orderedQty) || 0;
                  const received = Number(item.receivedQty) || 0;
                  const diff = received - ordered;
                  const lineTotal = received * (Number(item.unitPrice) || 0);

                  return (
                    <div
                      key={item.itemId || idx}
                      className="p-4 rounded-2xl bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200/80 dark:border-espresso-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                              {item.itemName}
                            </h4>
                            {item.hasCustomMapping && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                Vendor Agreement
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {item.masterItemName && item.masterItemName !== item.itemName && (
                              <span className="text-[10px] text-espresso-600 dark:text-cafe-300 font-semibold">
                                🏬 Master Stock: <strong>{item.masterItemName}</strong>
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-espresso-400 dark:text-cafe-400">
                              {item.sku} • Ordered: {ordered} {item.unit}
                            </span>
                          </div>
                        </div>

                        {diff !== 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              diff < 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {diff < 0 ? `${diff} ${item.unit} Shortage` : `+${diff} Extra`}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400 mb-1">
                            Received Quantity ({item.unit})
                          </label>
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={item.receivedQty}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 rounded-l-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <span className="px-3 py-2 text-xs font-bold bg-cafe-100 dark:bg-espresso-700 border-y border-r border-cafe-200 dark:border-espresso-700 rounded-r-xl text-espresso-700 dark:text-cafe-300">
                              {item.unit}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400 mb-1">
                            Invoice Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handlePriceChange(idx, e.target.value)}
                            className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-1.5 border-t border-cafe-200/60 dark:border-espresso-800 gap-1">
                        <span className="text-espresso-600 dark:text-cafe-400">
                          📦 Delivered Net Weight/Vol: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{((Number(item.receivedQty) || 0) * (Number(item.packageWeight) || 1.0)).toFixed(1)} {item.packageWeightUnit || 'kg'}</strong>
                          <span className="text-espresso-400 ml-1">({item.receivedQty} × {item.packageWeight || 1.0} {item.packageWeightUnit || 'kg'})</span>
                        </span>
                        <span className="font-bold text-espresso-800 dark:text-cafe-200">
                          Line Cost: {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Received By (Staff Name)
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Delivery / Packing Slip Notes
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Invoice #9918 signed, batch exp 2027"
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  />
                </div>
              </div>

              {/* Financial Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Total Reconciled Delivery Value
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Stock will be committed instantly to inventory
                  </p>
                </div>
                <p className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalReconciledCost)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || itemsState.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Receiving Stock...' : 'Confirm Goods Receipt & Add to Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
