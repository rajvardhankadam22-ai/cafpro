'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Download,
  Search,
  Filter,
  Layers,
  Sparkles,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '../layout';
import InventoryTable from '@/components/InventoryTable';
import { exportToCsv, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import PagePurposeBanner from '@/components/PagePurposeBanner';

export default function InventoryCataloguePage() {
  const toast = useToast();
  const {
    items,
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    lowStockItems,
    outOfStockItems,
    openAddItem,
    openEditItem,
    openDeleteItem,
    adjustQuantity,
    openRestock,
    purchaseOrders,
    role,
    currentUser,
  } = useDashboard();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'instock' | 'lowstock' | 'outofstock'

  // Handle incoming query params (from Categories, Overview, or Reorder redirects)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      const statusParam = params.get('status');
      const addParam = params.get('add');

      if (catParam) setSelectedCategory(catParam);
      if (statusParam) setSelectedStatus(statusParam);
      if (addParam === 'true') {
        openAddItem();
      }
    }
  }, [openAddItem]);

  // Memoized Filtered Items for ultra-fast filtering
  const filteredItems = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.supplier && item.supplier.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || item.categoryId === selectedCategory;

      let matchesStatus = true;
      const qty = Number(item.quantity) || 0;
      const reorder = Number(item.reorderLevel) || 5;

      if (selectedStatus === 'outofstock') {
        matchesStatus = qty === 0;
      } else if (selectedStatus === 'lowstock') {
        matchesStatus = qty > 0 && qty <= reorder;
      } else if (selectedStatus === 'instock') {
        matchesStatus = qty > reorder;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const filteredValuation = React.useMemo(() => {
    return filteredItems.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
      0
    );
  }, [filteredItems]);

  const healthyCount = items.length - lowStockItems.length - outOfStockItems.length;

  const handleExportCsv = () => {
    try {
      exportToCsv(filteredItems, categories);
      toast.success(`Exported ${filteredItems.length} items to CSV (INR ₹)`, 'Download Complete');
    } catch (e) {
      toast.error('Failed to export CSV', 'Error');
    }
  };

  const STATUS_FILTERS = [
    { id: 'all', label: 'All Items', count: items.length, dotClass: 'bg-caramel-500' },
    { id: 'instock', label: 'Healthy Stock', count: healthyCount, dotClass: 'bg-emerald-500' },
    { id: 'lowstock', label: 'Low Stock', count: lowStockItems.length, dotClass: 'bg-amber-500' },
    { id: 'outofstock', label: 'Out of Stock', count: outOfStockItems.length, dotClass: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              All Items & Stock
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-caramel-100 text-caramel-800 dark:bg-caramel-950/60 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800/60">
              ☕ {currentUser?.cafeName || 'CaféPulse Flagship'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Complete catalogue of all café ingredients, stock levels, PAR thresholds, and barcodes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-espresso-700 dark:text-cafe-200 bg-white dark:bg-espresso-900 border border-cafe-200 dark:border-espresso-700 hover:bg-cafe-50 dark:hover:bg-espresso-800 transition-all shadow-cafe-sm"
          >
            <History className="w-4 h-4 text-caramel-600 dark:text-caramel-400" />
            <span>History</span>
          </Link>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-espresso-700 dark:text-cafe-200 bg-white dark:bg-espresso-900 border border-cafe-200 dark:border-espresso-700 hover:bg-cafe-50 dark:hover:bg-espresso-800 transition-all shadow-cafe-sm"
          >
            <Download className="w-4 h-4 text-espresso-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddItem}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Item</span>
          </button>
        </div>
      </div>

      {/* Prominent Page Purpose Banner */}
      <PagePurposeBanner
        purpose="Your live inventory ledger. Add new beans and supplies, track on-hand quantities, log shift usage (-1), and export full CSV stock sheets."
        badgeText="Items & Stock Purpose"
        accentColor="caramel"
        primaryAction={{
          label: "+ Add New Item",
          onClick: openAddItem,
        }}
        actions={[
          {
            title: "Add & Edit Catalogue",
            desc: "Register coffee beans, syrups, dairy, and cups with SKU, PAR target, and unit purchase cost.",
          },
          {
            title: "Shift Use (-1)",
            desc: "Baristas tap -1 whenever they open a milk carton, syrup bottle, or fresh coffee bag during shifts.",
          },
          {
            title: "Direct Restock (+)",
            desc: "Click Restock to immediately log incoming stock or manual shelf adjustments with reason notes.",
          },
          {
            title: "Filter & CSV Export",
            desc: "Filter by stock health (Healthy, Low, Out of Stock) and export formatted inventory reports.",
          },
        ]}
      />

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'all'
              ? 'bg-espresso-900 text-white dark:bg-caramel-600 dark:text-white border-transparent shadow-sm'
              : 'bg-white dark:bg-espresso-900 text-espresso-700 dark:text-cafe-300 border-cafe-200 dark:border-espresso-800 hover:bg-cafe-50'
          }`}
        >
          All Categories ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-espresso-900 text-white dark:bg-caramel-600 dark:text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-espresso-900 text-espresso-700 dark:text-cafe-300 border-cafe-200 dark:border-espresso-800 hover:bg-cafe-50'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Blended Segmented Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-cafe-100/70 dark:bg-espresso-900/60 border border-cafe-200/60 dark:border-espresso-800/60">
          {STATUS_FILTERS.map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-cafe-sm font-bold'
                    : 'text-espresso-600 dark:text-cafe-400 hover:text-espresso-900 dark:hover:text-cafe-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab.dotClass}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-cafe-100 text-espresso-900 dark:bg-espresso-700 dark:text-cafe-100'
                      : 'bg-cafe-200/60 text-espresso-600 dark:bg-espresso-800 dark:text-cafe-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-espresso-600 dark:text-cafe-300">
          {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-caramel-700 dark:text-caramel-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}

          <span>
            Valuation: <strong className="text-espresso-950 dark:text-cafe-50 font-bold">{formatCurrency(filteredValuation)}</strong>
          </span>
          <span>
            Showing: <strong className="text-espresso-950 dark:text-cafe-50 font-bold">{filteredItems.length}</strong> items
          </span>
        </div>
      </div>

      {/* Main Inventory Table */}
      <InventoryTable
        items={filteredItems}
        categories={categories}
        purchaseOrders={purchaseOrders}
        role={role}
        onEdit={openEditItem}
        onDelete={openDeleteItem}
        onAdjustQuantity={adjustQuantity}
        onOpenRestock={openRestock}
        isLoading={isLoading}
      />
    </div>
  );
}
