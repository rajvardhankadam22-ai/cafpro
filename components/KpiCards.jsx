'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function KpiCards({
  totalItems = 0,
  lowStockCount = 0,
  outOfStockCount = 0,
  totalValuation = 0,
  selectedStatusFilter = 'all',
  onSelectFilter = () => {},
}) {
  const cards = [
    {
      id: 'total',
      filterValue: 'all',
      title: 'Total Unique Items',
      value: formatNumber(totalItems),
      subtitle: 'Active catalogue SKUs',
      icon: Package,
      badge: `${totalItems} tracked`,
      badgeStyle: 'bg-cafe-100 text-espresso-800 dark:bg-espresso-800 dark:text-cafe-200 border-cafe-200 dark:border-espresso-700',
      iconColor: 'text-caramel-600 dark:text-caramel-400',
      iconBg: 'bg-caramel-50 dark:bg-caramel-950/50',
      borderColor: 'hover:border-caramel-300 dark:hover:border-caramel-700',
    },
    {
      id: 'lowstock',
      filterValue: 'lowstock',
      title: 'Low Stock Items',
      value: formatNumber(lowStockCount),
      subtitle: 'Needs replenishment soon',
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? '🟡 Action Needed' : '🟢 Optimal',
      badgeStyle:
        lowStockCount > 0
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-200 dark:border-amber-800/60'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    {
      id: 'outofstock',
      filterValue: 'outofstock',
      title: 'Out of Stock Items',
      value: formatNumber(outOfStockCount),
      subtitle: 'Zero units on hand',
      icon: AlertCircle,
      badge: outOfStockCount > 0 ? '🔴 Critical Shortage' : '🟢 Zero Depletion',
      badgeStyle:
        outOfStockCount > 0
          ? 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-200 dark:border-red-800/60'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-950/50',
      borderColor: 'hover:border-red-300 dark:hover:border-red-700',
    },
    {
      id: 'valuation',
      filterValue: 'all',
      title: 'Total Inventory Value',
      value: formatCurrency(totalValuation),
      subtitle: 'Cumulative on-hand asset worth',
      icon: IndianRupee,
      badge: 'Live Valuation',
      badgeStyle: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isSelected = selectedStatusFilter === card.filterValue && card.filterValue !== 'all';

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => onSelectFilter(card.filterValue)}
            className={`cursor-pointer relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-[#181310] border transition-all duration-200 shadow-cafe-sm hover:shadow-cafe-md ${
              isSelected
                ? 'ring-2 ring-caramel-500 border-caramel-500 bg-caramel-50/20 dark:bg-caramel-950/30'
                : `border-cafe-200/80 dark:border-espresso-800/80 ${card.borderColor}`
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeStyle}`}
              >
                {card.badge}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-espresso-400 dark:text-cafe-400">
                {card.title}
              </h3>
              <p className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1 tracking-tight font-sans">
                {card.value}
              </p>
              <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 flex items-center gap-1">
                <span>{card.subtitle}</span>
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
