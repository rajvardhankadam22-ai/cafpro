'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package,
  Building,
  ArrowRight,
  Download,
  Check,
  Sparkles,
  Zap,
  Truck,
  FilePlus,
  ArrowUpRight,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '../layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import PagePurposeBanner from '@/components/PagePurposeBanner';

export default function ReorderReplenishmentPage() {
  const toast = useToast();
  const {
    items,
    categories,
    lowStockItems,
    outOfStockItems,
    openRestock,
    adjustQuantity,
    openCreatePo,
    role,
  } = useDashboard();

  const [isBatchRestocking, setIsBatchRestocking] = useState(false);
  const urgentItems = [...outOfStockItems, ...lowStockItems];

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Calculate estimated total replenishment budget needed using PAR level formula:
  const totalReorderEstimatedCost = urgentItems.reduce((acc, item) => {
    const currentQty = Number(item.quantity) || 0;
    const par = Number(item.parLevel) || ((Number(item.reorderLevel) || 5) * 2);
    const deficit = Math.ceil(Math.max(1, par - currentQty));
    return acc + deficit * (Number(item.unitPrice) || 0);
  }, 0);

  const handleCreatePoForShortages = () => {
    if (urgentItems.length === 0) return;
    openCreatePo('', urgentItems);
  };

  const handleCreatePoForItem = (item) => {
    openCreatePo(item.supplier || '', [item]);
  };

  const handleDirectEmergencyRestock = async (item, suggestedQty) => {
    try {
      await adjustQuantity(item.id, suggestedQty, item.name);
      toast.success(`Direct adjustment: +${suggestedQty} ${item.unit} added to stock`, 'Stock Level Updated');
    } catch (e) {
      toast.error('Failed to adjust stock', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              Low Stock & Reorder
            </h1>
            {urgentItems.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60 animate-pulse">
                {urgentItems.length} Item{urgentItems.length > 1 ? 's' : ''} Need Reordering
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Automated replenishment planner to calculate shortage deficits and generate supplier purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {role !== 'barista' && urgentItems.length > 0 && (
            <button
              onClick={handleCreatePoForShortages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all hover:scale-105 active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              <span>Order All Low Items ({urgentItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Page Purpose Banner */}
      <PagePurposeBanner
        purpose="Prevent stockouts and rush emergencies. Automatically scans your catalogue against safety PAR levels, shows calculated restocking deficits, and prepares supplier POs in 1-click."
        badgeText="Reorder Planner Purpose"
        accentColor="amber"
        primaryAction={
          urgentItems.length > 0
            ? {
                label: `Order All Low Items (${urgentItems.length})`,
                onClick: handleCreatePoForShortages,
              }
            : null
        }
        actions={[
          {
            title: "Live Shortage Detection",
            desc: "Items automatically appear here the instant their on-hand count drops below their reorder threshold.",
          },
          {
            title: "Smart PAR Calculation",
            desc: "Calculates the exact units needed to refill shelves back to full capacity (PAR Level - Current Stock).",
          },
          {
            title: "1-Click Bulk PO Generation",
            desc: "Click 'Order All Low Items' to automatically group shortages into purchase orders for designated suppliers.",
          },
          {
            title: "Emergency Quick Restock",
            desc: "Tap 'Direct Restock' on individual rows to instantly increment counts if you bought stock locally.",
          },
        ]}
      />

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Out of Stock
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {outOfStockItems.length} Products
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center border border-red-200 dark:border-red-800/40">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Below Reorder Level
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {lowStockItems.length} Products
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              PAR Fulfillment Budget
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {formatCurrency(totalReorderEstimatedCost)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main List of Shortage Items */}
      {urgentItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-espresso-950 dark:text-cafe-50">
              All Storage PAR Levels Met!
            </h3>
            <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 max-w-md mx-auto">
              All café inventory items are safely stocked above minimum safety thresholds.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/inventory"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cafe-100 dark:bg-espresso-800 text-espresso-900 dark:text-cafe-100 hover:bg-cafe-200 transition-all flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>Browse Full Catalogue</span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Track Orders & Deliveries</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-espresso-600 dark:text-cafe-400">
              Shortage Items Requiring PAR Replenishment ({urgentItems.length})
            </h2>
            <span className="text-xs font-semibold text-espresso-500 dark:text-cafe-400">
              Issue PO to Supplier or perform Emergency Adjustment
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            <AnimatePresence>
              {urgentItems.map((item) => {
                const isOOS = Number(item.quantity) === 0;
                const currentQty = Number(item.quantity) || 0;
                const reorderLvl = Number(item.reorderLevel) || 5;
                const parLvl = Number(item.parLevel) || (reorderLvl * 2);
                const suggestedRestockQty = Math.ceil(Math.max(1, parLvl - currentQty));
                
                const preferredMapping = (item.vendorMappings || []).find((vm) => vm.isPreferred) || (item.vendorMappings || [])[0];
                const activeVendor = preferredMapping ? preferredMapping.vendorName : (item.supplier || 'Direct Roastery');
                const activePrice = preferredMapping && preferredMapping.unitPrice > 0 ? Number(preferredMapping.unitPrice) : (Number(item.unitPrice) || 0);
                const suggestedCost = suggestedRestockQty * activePrice;
                const categoryName = categoryMap.get(item.categoryId) || 'General';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-cafe-sm ${
                      isOOS
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                    }`}
                  >
                    {/* Item Description */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOOS
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isOOS ? '🔴 Out of Stock' : '🟡 Low Stock'}
                        </span>
                        <span className="text-xs font-semibold text-espresso-600 dark:text-cafe-300">
                          {categoryName}
                        </span>
                        <span className="font-mono text-[11px] text-espresso-400 dark:text-cafe-500">
                          {preferredMapping?.vendorSku || item.sku}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                        {item.name}
                      </h3>

                      <p className="text-xs text-espresso-500 dark:text-cafe-400">
                        Preferred Vendor:{' '}
                        <strong className="text-espresso-800 dark:text-cafe-200 font-semibold">
                          {activeVendor}
                        </strong>
                        {preferredMapping && (
                          <span className="text-espresso-400 ml-1">
                            ("{preferredMapping.vendorItemName}" @ ₹{preferredMapping.unitPrice})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Stock Metrics & Suggested Order */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-espresso-400 dark:text-cafe-400">Stock / Trigger / PAR</p>
                        <p className="text-xs font-bold text-espresso-950 dark:text-cafe-100">
                          <span className="text-amber-600 font-mono text-sm">{currentQty}</span> / {reorderLvl} (PAR: <strong className="text-emerald-700 dark:text-emerald-300">{parLvl} {item.unit}</strong>)
                        </p>
                      </div>

                      {role !== 'barista' && (
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-espresso-400 dark:text-cafe-400">PAR Fulfillment</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            +{suggestedRestockQty} {item.unit} ({formatCurrency(suggestedCost)})
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Primary PO Route */}
                        {role !== 'barista' && (
                          <button
                            onClick={() => handleCreatePoForItem(item)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-sm transition-all active:scale-95"
                            title="Issue Purchase Order to Supplier"
                          >
                            <FilePlus className="w-3.5 h-3.5" />
                            <span>Issue PO</span>
                          </button>
                        )}

                        {/* Emergency Quick Direct Floor Adjustment */}
                        <button
                          onClick={() => handleDirectEmergencyRestock(item, suggestedRestockQty)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition-all active:scale-95"
                          title="Direct shelf count correction / transfer (Bypasses PO)"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Direct +{suggestedRestockQty}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
