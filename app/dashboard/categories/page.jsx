'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Tags,
  Coffee,
  Milk,
  Sparkles,
  Croissant,
  Leaf,
  Box,
  ShieldCheck,
  Tag,
  Edit3,
  Trash2,
  Package,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import PagePurposeBanner from '@/components/PagePurposeBanner';

const ICON_COMPONENTS = {
  Coffee,
  Milk,
  Sparkles,
  Croissant,
  Leaf,
  Box,
  ShieldCheck,
  Tag,
};

export default function CategoriesPage() {
  const {
    categories,
    items,
    openAddCategory,
    openEditCategory,
    deleteCategory,
    openAddItem,
  } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
            Categories & Departments
          </h1>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Organize stock into departments, track category-level capital investment, and standardize SKU numbering.
          </p>
        </div>

        <button
          onClick={openAddCategory}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Category</span>
        </button>
      </div>

      {/* Prominent Page Purpose Banner */}
      <PagePurposeBanner
        purpose="Departmental taxonomy management. Group your inventory into logical departments (Coffee, Dairy, Syrups, Bakery, Packaging) to maintain clean reporting and track department asset valuations."
        badgeText="Categories Purpose"
        accentColor="purple"
        primaryAction={{
          label: "+ Add Category",
          onClick: openAddCategory,
        }}
        actions={[
          {
            title: "Create Custom Sections",
            desc: "Define departments like Specialty Coffee, Dairy, Syrups, Bakery, or Eco-Packaging with custom icons.",
          },
          {
            title: "Auto SKU Generation",
            desc: "New catalogue items assigned to a category automatically inherit clean prefix codes (e.g. COF-01, MLK-02).",
          },
          {
            title: "Section Asset Value (₹)",
            desc: "Each card computes the exact rupee valuation and active item count stored in that department.",
          },
          {
            title: "Safe Re-assignment",
            desc: "Edit names and icons anytime, or delete categories with automatic item reallocation safeguards.",
          },
        ]}
      />

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat, idx) => {
          const IconComp = ICON_COMPONENTS[cat.icon] || Coffee;
          const catItems = items.filter((item) => item.categoryId === cat.id);
          const catValuation = catItems.reduce(
            (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
            0
          );
          const lowStockCount = catItems.filter(
            (i) => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.reorderLevel || 5)
          ).length;
          const oosCount = catItems.filter((i) => Number(i.quantity) === 0).length;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm hover:shadow-cafe-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-caramel-50 dark:bg-caramel-950/60 text-caramel-600 dark:text-caramel-400 flex items-center justify-center border border-caramel-200/80 dark:border-caramel-800/50 shadow-sm">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-2 rounded-xl text-espresso-400 hover:text-caramel-600 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
                      title="Edit Category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete category "${cat.name}"? Items in this category will become uncategorized.`
                          )
                        ) {
                          deleteCategory(cat.id, cat.name);
                        }
                      }}
                      className="p-2 rounded-xl text-espresso-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-4">
                  <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50 tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 line-clamp-2">
                    {cat.description || 'Standard café operational stock department.'}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mt-5 p-3.5 rounded-2xl bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200/60 dark:border-espresso-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-espresso-400 dark:text-cafe-400">
                      Total SKUs
                    </span>
                    <p className="text-base font-extrabold text-espresso-950 dark:text-cafe-100 mt-0.5">
                      {catItems.length} Products
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-espresso-400 dark:text-cafe-400">
                      Category Value
                    </span>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(catValuation)}
                    </p>
                  </div>
                </div>

                {/* Alerts row */}
                {(lowStockCount > 0 || oosCount > 0) && (
                  <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold">
                    {oosCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                        {oosCount} Out of Stock
                      </span>
                    )}
                    {lowStockCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {lowStockCount} Low Stock
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* View inventory link */}
              <div className="mt-5 pt-4 border-t border-cafe-100 dark:border-espresso-800/80 flex items-center justify-between">
                <Link
                  href={`/dashboard/inventory?category=${cat.id}`}
                  className="text-xs font-bold text-caramel-600 dark:text-caramel-400 hover:text-caramel-700 flex items-center gap-1.5"
                >
                  <span>Browse {cat.name} ({catItems.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/dashboard/inventory?category=${cat.id}&add=true`}
                  className="text-xs font-semibold text-espresso-600 dark:text-cafe-400 hover:text-espresso-900 dark:hover:text-cafe-100"
                >
                  + Add Item
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
