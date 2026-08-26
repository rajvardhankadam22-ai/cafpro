'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Package, ArrowLeft } from 'lucide-react';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard view error:', error);
  }, [error]);

  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#181310] border border-amber-300/80 dark:border-amber-800/60 shadow-cafe-md text-center max-w-xl mx-auto space-y-6 my-10 animate-pageFadeIn">
      {/* Icon */}
      <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800 shadow-sm">
        <AlertCircle className="w-8 h-8 animate-pulse" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          Dashboard Recovery
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
          Unable to Load Section
        </h2>
        <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 leading-relaxed max-w-md mx-auto">
          We encountered an issue rendering this workspace section. You can retry loading or return to the safe inventory view.
        </p>
      </div>

      {/* Error Message Snippet */}
      {error && (
        <div className="p-3 rounded-2xl bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-800 text-left">
          <p className="text-[11px] font-mono text-espresso-600 dark:text-cafe-300 line-clamp-2 break-all">
            {typeof error === 'string'
              ? error
              : error?.message
              ? error.message
              : typeof error === 'object' && error?.type
              ? `Event: ${error.type}`
              : 'Unable to render this dashboard section.'}
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Section</span>
        </button>
        <Link
          href="/dashboard/inventory"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-espresso-700 dark:text-cafe-200 bg-cafe-100 dark:bg-espresso-800 hover:bg-cafe-200 dark:hover:bg-espresso-700 border border-cafe-200 dark:border-espresso-700 transition-all"
        >
          <Package className="w-4 h-4" />
          <span>Go to Inventory</span>
        </Link>
      </div>
    </div>
  );
}
