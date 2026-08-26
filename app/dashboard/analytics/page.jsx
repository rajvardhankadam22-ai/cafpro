'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  IndianRupee,
  Package,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

export default function AnalyticsPage() {
  const { items, categories, activityLogs, totalValuation, lowStockItems, outOfStockItems, role, currentUser } =
    useDashboard();

  const healthyItemsCount = items.length - lowStockItems.length - outOfStockItems.length;

  // Valuation by category (Memoized)
  const categoryValuations = React.useMemo(() => {
    return categories
      .map((cat) => {
        const catItems = items.filter((item) => item.categoryId === cat.id);
        const val = catItems.reduce(
          (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
          0
        );
        const percentage = totalValuation > 0 ? (val / totalValuation) * 100 : 0;
        return {
          id: cat.id,
          name: cat.name,
          itemCount: catItems.length,
          valuation: val,
          percentage: percentage.toFixed(1),
        };
      })
      .sort((a, b) => b.valuation - a.valuation);
  }, [categories, items, totalValuation]);

  // Top 5 most valuable stock items (Memoized)
  const topValuableItems = React.useMemo(() => {
    return [...items]
      .map((item) => ({
        ...item,
        totalValue: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
          Stock Value & Costs
        </h1>
        <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
          Financial valuation, COGS breakdowns, inventory health ratios, and high-value stock intelligence.
        </p>
      </div>

      {/* Stock Health & Valuation Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Health Status Card */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
              Catalogue Health Ratio
            </h3>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-cafe-100 dark:bg-espresso-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${items.length ? (healthyItemsCount / items.length) * 100 : 100}%`,
                }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title="Healthy Stock"
              />
              <div
                style={{
                  width: `${items.length ? (lowStockItems.length / items.length) * 100 : 0}%`,
                }}
                className="bg-amber-500 h-full transition-all duration-500"
                title="Low Stock"
              />
              <div
                style={{
                  width: `${items.length ? (outOfStockItems.length / items.length) * 100 : 0}%`,
                }}
                className="bg-red-500 h-full transition-all duration-500"
                title="Out of Stock"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-1">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {healthyItemsCount} In Stock
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {lowStockItems.length} Low
              </span>
              <span className="flex items-center gap-1.5 text-red-700 dark:text-red-300">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {outOfStockItems.length} OOS
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200/60 dark:border-espresso-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-espresso-500 dark:text-cafe-400">Total Unique SKUs:</span>
              <span className="font-bold text-espresso-950 dark:text-cafe-100">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-espresso-500 dark:text-cafe-400">Stock Availability:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {items.length ? (((items.length - outOfStockItems.length) / items.length) * 100).toFixed(1) : 100}%
              </span>
            </div>
          </div>
        </div>

        {/* Top 5 High-Value Assets */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300">
                <IndianRupee className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                Top High-Value Stock Assets
              </h3>
            </div>
            <span className="text-xs font-semibold text-espresso-500 dark:text-cafe-400">
              Total: {formatCurrency(totalValuation)}
            </span>
          </div>

          <div className="space-y-2.5">
            {topValuableItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-espresso-500 dark:text-cafe-400">
                <p className="font-bold text-espresso-800 dark:text-cafe-200">No Inventory Items Cataloged</p>
                <p className="mt-1">Add items to view top asset valuations and ranking.</p>
              </div>
            ) : (
              topValuableItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-cafe-50/70 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-cafe-200 dark:bg-espresso-800 flex items-center justify-center text-[11px] font-bold text-espresso-700 dark:text-cafe-300 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-espresso-950 dark:text-cafe-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                        {item.quantity} {item.unit} @ {formatCurrency(Number(item.unitPrice) || 0)} / {item.unit}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-espresso-950 dark:text-cafe-50 shrink-0">
                    {formatCurrency(item.totalValue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Valuation Breakdown Table */}
      <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4">
        <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
          Valuation Breakdown by Department
        </h3>

        {categoryValuations.length === 0 ? (
          <div className="py-8 text-center text-xs text-espresso-500 dark:text-cafe-400">
            <p className="font-bold text-espresso-800 dark:text-cafe-200">No Categories Created</p>
            <p className="mt-1">Create categories in Categories & Tags to view department cost breakdowns.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryValuations.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-cafe-50/60 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-espresso-900 dark:text-cafe-100 truncate">
                    {cat.name}
                  </span>
                  <span className="text-xs font-bold text-caramel-600 dark:text-caramel-400">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-cafe-200 dark:bg-espresso-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-caramel-600 rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-espresso-500 dark:text-cafe-400 pt-1">
                  <span>{cat.itemCount} SKUs</span>
                  <span className="font-bold text-espresso-950 dark:text-cafe-100">
                    {formatCurrency(cat.valuation)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Intelligence & Cost Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost Risk & Capital Efficiency Card */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                Capital Risk & Stock Health
              </h3>
            </div>
            <Link
              href={['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
              className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:underline flex items-center gap-1"
            >
              <span>{['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? 'Reorder Planner' : 'View Low Stock'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-cafe-50 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-espresso-950 dark:text-cafe-100">Low Stock Capital Risk</p>
                <p className="text-[11px] text-espresso-500 dark:text-cafe-400">Potential revenue loss from {lowStockItems.length + outOfStockItems.length} shortage items</p>
              </div>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(
                  [...lowStockItems, ...outOfStockItems].reduce(
                    (acc, i) => acc + (Number(i.unitPrice) || 0) * (Number(i.reorderLevel) || 5),
                    0
                  )
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-cafe-50 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-espresso-950 dark:text-cafe-100">Top Capital Concentration</p>
                <p className="text-[11px] text-espresso-500 dark:text-cafe-400">
                  {categoryValuations[0]?.name || 'Primary Department'} holds {categoryValuations[0]?.percentage || 0}% of all stock capital
                </p>
              </div>
              <Link
                href={['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? '/dashboard/categories' : '/dashboard/inventory'}
                className="font-bold text-caramel-600 dark:text-caramel-400 hover:underline text-xs"
              >
                {['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? 'View Categories \u2192' : 'View Catalogue \u2192'}
              </Link>
            </div>
          </div>
        </div>

        {/* Audit Log Redirect Card */}
        <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-espresso-950 dark:text-cafe-50">
                  Inventory Audit & Movement Ledger
                </h3>
              </div>
              <span className="text-xs font-semibold text-espresso-500 dark:text-cafe-400">
                {activityLogs.length} Total Events
              </span>
            </div>

            <p className="text-xs text-espresso-600 dark:text-cafe-400 mt-3 leading-relaxed">
              Every barcode scan, barista shift usage (`-1`), restock event, and price edit is recorded chronologically in the dedicated audit ledger.
            </p>
          </div>

          <div className="pt-4 border-t border-cafe-100 dark:border-espresso-800 flex items-center justify-between">
            <span className="text-xs text-espresso-500 dark:text-cafe-400">
              Auditor-ready CSV & timestamp filters available
            </span>
            <Link
              href="/dashboard/history"
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Open Activity Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
