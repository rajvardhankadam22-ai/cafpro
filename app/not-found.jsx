import React from 'react';
import Link from 'next/link';
import { Coffee, Home, Package, Truck, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0706] text-cafe-50 flex items-center justify-center p-6 selection:bg-caramel-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-caramel-950/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-espresso-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full p-8 sm:p-10 rounded-3xl bg-[#140F0C]/90 border border-espresso-800/60 backdrop-blur-xl shadow-2xl text-center space-y-6">
        {/* Animated 404 Header Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-caramel-950/60 border border-caramel-800/40 text-caramel-400 flex items-center justify-center shadow-inner">
            <Coffee className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-2 px-3 py-0.5 rounded-full text-xs font-black bg-caramel-600 text-white shadow-caramel-glow tracking-widest">
            404
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2 pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-cafe-50 tracking-tight">
            Page Off the Menu
          </h1>
          <p className="text-xs sm:text-sm text-espresso-300 leading-relaxed max-w-sm mx-auto">
            The page or workspace you're looking for doesn't exist, has moved, or was removed.
          </p>
        </div>

        {/* Quick Links Card */}
        <div className="p-4 rounded-2xl bg-[#1C1612]/70 border border-espresso-800/70 text-left space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-caramel-400">
            Suggested Destinations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-espresso-900/60 hover:bg-espresso-800/80 border border-espresso-800 text-xs font-bold text-cafe-200 hover:text-white transition-all"
            >
              <Home className="w-4 h-4 text-caramel-400" />
              <span>Store Dashboard</span>
            </Link>
            <Link
              href="/dashboard/inventory"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-espresso-900/60 hover:bg-espresso-800/80 border border-espresso-800 text-xs font-bold text-cafe-200 hover:text-white transition-all"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>All Inventory</span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-espresso-900/60 hover:bg-espresso-800/80 border border-espresso-800 text-xs font-bold text-cafe-200 hover:text-white transition-all"
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Orders & POs</span>
            </Link>
            <Link
              href="/supplier/portal"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-espresso-900/60 hover:bg-espresso-800/80 border border-espresso-800 text-xs font-bold text-cafe-200 hover:text-white transition-all"
            >
              <Coffee className="w-4 h-4 text-purple-400" />
              <span>Wholesale Portal</span>
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CafePulse Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
