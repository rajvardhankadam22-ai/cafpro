'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Building,
  Package,
  Truck,
  Users,
  BarChart3,
  IndianRupee,
  FileText,
  Shield,
  Coffee,
  Store,
} from 'lucide-react';
import { useDashboard } from './layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function DashboardOverviewPage() {
  const toast = useToast();
  const {
    items,
    categories,
    activityLogs,
    isLoading,
    lowStockItems,
    outOfStockItems,
    totalValuation,
    openAddItem,
    openRestock,
    openCreatePo,
    purchaseOrders,
    vendors,
    staffMembers,
    role,
    currentUser,
  } = useDashboard();

  const userRole = currentUser?.role || role || 'admin';
  const canReorder = ['admin', 'manager', 'head_barista'].includes(userRole);
  const canManageOrders = ['admin', 'manager', 'head_barista', 'barista'].includes(userRole);
  const canManageVendors = ['admin', 'manager', 'head_barista'].includes(userRole);
  const canManageTeam = ['admin', 'manager', 'head_barista'].includes(userRole);
  const canManageCategories = ['admin', 'manager', 'head_barista'].includes(userRole);
  const canViewAnalytics = ['admin', 'manager', 'auditor'].includes(userRole);
  const canAddItem = ['admin', 'manager'].includes(userRole);

  const urgentItems = [...outOfStockItems, ...lowStockItems];
  const healthyCount = items.length - urgentItems.length;
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'PENDING_DELIVERY');
  const deliveredOrders = purchaseOrders.filter((po) => po.status === 'DELIVERED');

  // Category valuations summary
  const categorySummary = categories.map((cat) => {
    const catItems = items.filter((i) => i.categoryId === cat.id);
    const catVal = catItems.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
      0
    );
    const catUrgent = catItems.filter(
      (i) => Number(i.quantity) <= Number(i.reorderLevel || 5)
    ).length;

    return {
      id: cat.id,
      name: cat.name,
      itemCount: catItems.length,
      valuation: catVal,
      urgentCount: catUrgent,
    };
  }).sort((a, b) => b.valuation - a.valuation);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              Store Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-caramel-100 text-caramel-900 dark:bg-caramel-950/80 dark:text-caramel-300 border border-caramel-300 dark:border-caramel-800/80 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>☕ {currentUser?.cafeName || 'CaféPulse Flagship'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            {userRole === 'barista'
              ? 'Shift workspace: check live ingredient stock, receive incoming supplier shipments, and log shift usage (-1).'
              : userRole === 'auditor'
              ? 'Auditing command center: monitor stock valuation, asset distribution, and complete activity history.'
              : 'Executive operational overview of café stock levels, supplier shipments, and live store health.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/inventory"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-espresso-700 dark:text-cafe-200 bg-white dark:bg-espresso-900 border border-cafe-200 dark:border-espresso-700 hover:bg-cafe-50 dark:hover:bg-espresso-800 transition-all shadow-cafe-sm"
          >
            <Package className="w-4 h-4 text-caramel-600 dark:text-caramel-400" />
            <span>Catalogue ({items.length})</span>
          </Link>

          {urgentItems.length > 0 && (
            <Link
              href={canReorder ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-all shadow-cafe-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{canReorder ? `Reorder (${urgentItems.length})` : `Shortages (${urgentItems.length})`}</span>
            </Link>
          )}

          {canAddItem && (
            <button
              onClick={openAddItem}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Item</span>
            </button>
          )}
        </div>
      </div>



      {/* 4 Core Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-espresso-500 dark:text-cafe-400">
              Total Stock Valuation
            </span>
            <div className="w-9 h-9 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
              {formatCurrency(totalValuation)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Across {items.length} unique products</span>
            </p>
          </div>
        </div>

        {/* Stock Health */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-espresso-500 dark:text-cafe-400">
              Healthy Stock Levels
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
              {healthyCount} <span className="text-sm font-normal text-espresso-400">/ {items.length}</span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {items.length ? Math.round((healthyCount / items.length) * 100) : 100}% of catalogue fully stocked
            </p>
          </div>
        </div>

        {/* Urgent Shortages */}
        <Link
          href={canReorder ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
          className="p-5 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm space-y-3 hover:border-amber-400 dark:hover:border-amber-600 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Items to Reorder
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
              {urgentItems.length} <span className="text-sm font-normal text-espresso-400">Products</span>
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
              <span>{outOfStockItems.length} out of stock • {lowStockItems.length} low stock &rarr;</span>
            </p>
          </div>
        </Link>

        {/* Shipments in Transit */}
        <Link
          href="/dashboard/orders"
          className="p-5 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Pending Deliveries
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
              {pendingOrders.length} <span className="text-sm font-normal text-espresso-400">Orders</span>
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold mt-1">
              {deliveredOrders.length} fulfilled previously &rarr;
            </p>
          </div>
        </Link>
      </div>

      {/* Two-Column Core Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Urgent Stock Replenishment Radar */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/50">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                    Stock Replenishment Radar
                  </h3>
                  <p className="text-[11px] text-espresso-500 dark:text-cafe-400">
                    Items running below safety PAR targets
                  </p>
                </div>
              </div>

              <Link
                href={canReorder ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
                className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:text-caramel-700 flex items-center gap-1 group"
              >
                <span>{canReorder ? 'Reorder Planner' : 'View in Catalogue'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="space-y-2.5 mt-3">
              {urgentItems.slice(0, 5).map((item) => {
                const isOOS = Number(item.quantity) === 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isOOS
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isOOS ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-espresso-950 dark:text-cafe-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                          {item.quantity} / {item.reorderLevel} {item.unit} • Target PAR: {item.parLevel || 20}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openRestock(item)}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restock</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {urgentItems.length === 0 && (
                <div className="py-8 text-center bg-emerald-50/30 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                    All Café Stock Levels Healthy!
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    No products are currently under their configured safety thresholds.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-cafe-100 dark:border-espresso-800 flex items-center justify-between text-xs">
            <span className="text-espresso-500 dark:text-cafe-400">
              {urgentItems.length} total shortage alerts
            </span>
            <Link
              href={canReorder ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
              className="font-bold text-caramel-600 dark:text-caramel-400 hover:underline"
            >
              {canReorder ? 'Open Automated Planner \u2192' : 'View Low Stock Items \u2192'}
            </Link>
          </div>
        </div>

        {/* 2. Pending Deliveries & Orders in Transit */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/50">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                    Deliveries & Purchase Orders
                  </h3>
                  <p className="text-[11px] text-espresso-500 dark:text-cafe-400">
                    Active shipments from wholesale suppliers
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/orders"
                className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:text-caramel-700 flex items-center gap-1 group"
              >
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="space-y-2.5 mt-3">
              {pendingOrders.slice(0, 5).map((po) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-espresso-950 dark:text-cafe-100 truncate">
                        {po.supplierName} • <span className="font-mono text-caramel-600">{po.poNumber}</span>
                      </p>
                      <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                        {po.items?.length || 0} line items • Expected: {formatDate(po.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-extrabold text-espresso-950 dark:text-cafe-100">
                      {formatCurrency(Number(po.totalCost) || Number(po.totalEstimatedCost) || 0)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200">
                      On Way
                    </span>
                  </div>
                </div>
              ))}

              {pendingOrders.length === 0 && (
                <div className="py-8 text-center bg-cafe-50 dark:bg-espresso-900/30 rounded-2xl border border-cafe-200 dark:border-espresso-800">
                  <Truck className="w-8 h-8 text-espresso-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-espresso-950 dark:text-cafe-100">
                    No Pending Shipments
                  </p>
                  <p className="text-[11px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                    All previously issued purchase orders have been reconciled and received.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-cafe-100 dark:border-espresso-800 flex items-center justify-between text-xs">
            <span className="text-espresso-500 dark:text-cafe-400">
              {pendingOrders.length} shipments pending arrival
            </span>
            <Link
              href="/dashboard/orders"
              className="font-bold text-caramel-600 dark:text-caramel-400 hover:underline"
            >
              {['admin', 'manager', 'head_barista'].includes(userRole)
                ? 'Issue New Purchase Order \u2192'
                : 'Receive Deliveries & Check Boxes \u2192'}
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Insights & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Department Value Breakdown */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/50">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                  Department Asset Distribution
                </h3>
                <p className="text-[11px] text-espresso-500 dark:text-cafe-400">
                  Capital investment across ingredient departments
                </p>
              </div>
            </div>

            {canManageCategories ? (
              <Link
                href="/dashboard/categories"
                className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:text-caramel-700 flex items-center gap-1 group"
              >
                <span>Manage ({categories.length})</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : canViewAnalytics ? (
              <Link
                href="/dashboard/analytics"
                className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:text-caramel-700 flex items-center gap-1 group"
              >
                <span>Analytics</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <span className="text-[11px] font-bold text-espresso-400">
                {categories.length} Categories
              </span>
            )}
          </div>

          <div className="space-y-3">
            {categorySummary.slice(0, 5).map((cat) => {
              const pct = totalValuation > 0 ? (cat.valuation / totalValuation) * 100 : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-espresso-950 dark:text-cafe-100 flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <span className="text-[10px] font-normal text-espresso-400">({cat.itemCount} SKUs)</span>
                    </span>
                    <span className="text-espresso-900 dark:text-cafe-50 font-mono">
                      {formatCurrency(cat.valuation)} <span className="text-[10px] font-normal text-espresso-400">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-cafe-100 dark:bg-espresso-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      className="h-full bg-gradient-to-r from-caramel-600 to-amber-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Live Activity & Audit Stream */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-caramel-50 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-400 flex items-center justify-center border border-caramel-200/60 dark:border-caramel-800/50">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                    Live Audit Stream
                  </h3>
                  <p className="text-[11px] text-espresso-500 dark:text-cafe-400">
                    Latest bar shift usage and restock events
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/history"
                className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:text-caramel-700 flex items-center gap-1 group"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="space-y-3 mt-3 max-h-52 overflow-y-auto pr-1 divide-y divide-cafe-100 dark:divide-espresso-800/60">
              {activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-espresso-900 dark:text-cafe-100 truncate">
                      {log.itemName || 'Stock Adjustment'}
                    </span>
                    <span className="text-[10px] text-espresso-400 dark:text-cafe-500 font-medium">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso-600 dark:text-cafe-400 mt-0.5 leading-snug">
                    {log.detail}
                  </p>
                </div>
              ))}

              {activityLogs.length === 0 && (
                <div className="py-6 text-center text-xs text-espresso-400">
                  No activity logs recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-cafe-100 dark:border-espresso-800 text-center">
            <Link
              href="/dashboard/history"
              className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:underline"
            >
              Download Complete Activity Audit (CSV) &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Dedicated Quick Navigation Launchers (Tailored to Role) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {userRole === 'barista' ? (
          /* Barista Launchers */
          <>
            <Link
              href="/dashboard/inventory"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-caramel-500 dark:hover:border-caramel-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-600 dark:group-hover:text-caramel-400 transition-colors">
                  All Items & Stock
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Full catalogue, barcodes, and shift usage (-1) &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/inventory"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-amber-500 dark:hover:border-amber-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Floor POS Stepper (-1)
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Rapid single-tap deductions during rush hours &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/orders"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Orders & Deliveries
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Receive delivered supplier boxes into stock &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/history"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Shift History Ledger
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Review logged shift deductions & timestamps &rarr;
                </p>
              </div>
            </Link>
          </>
        ) : userRole === 'auditor' ? (
          /* Auditor Launchers */
          <>
            <Link
              href="/dashboard/inventory"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-caramel-500 dark:hover:border-caramel-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-600 dark:group-hover:text-caramel-400 transition-colors">
                  All Items & Catalogue
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Inspect stock counts, SKUs, and unit rates &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-purple-500 dark:hover:border-purple-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Stock Value & Costs (₹)
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Total capital valuation & category cost ratios &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Department Asset Share
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Audit {categories.length} departments and ingredient investment &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/history"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Download Activity (CSV)
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Full historical ledger of restocks, usage & goods &rarr;
                </p>
              </div>
            </Link>
          </>
        ) : (
          /* Standard Launchers for Admin / Manager / Head Barista */
          <>
            <Link
              href="/dashboard/inventory"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-caramel-500 dark:hover:border-caramel-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-600 dark:group-hover:text-caramel-400 transition-colors">
                  All Items & Stock
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Full catalogue, barcodes, and shift usage (-1) &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/reorder"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-amber-500 dark:hover:border-amber-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Low Stock & Reorder
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Calculate exact PAR deficits and order low stock &rarr;
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/vendors"
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Suppliers & Quotes
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Wholesale agreements and roastery proposals &rarr;
                </p>
              </div>
            </Link>

            <Link
              href={canManageTeam ? '/dashboard/team' : '/dashboard/history'}
              className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-cafe-md transition-all group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Staff & PINs
                </p>
                <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                  Barista accounts, 4-digit floor PINs & roles &rarr;
                </p>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
