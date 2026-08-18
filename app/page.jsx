'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Coffee,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building,
  Store,
  Key,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { getCurrentUser } from '@/services/authService';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // If user has an active session, go straight to their dashboard
    const user = getCurrentUser();
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-cafe-50 via-cafe-100/50 to-cafe-200/30 dark:from-espresso-950 dark:via-[#16120E] dark:to-[#0F0C0A] relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-caramel-500/10 dark:bg-caramel-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl text-center space-y-6 relative z-10"
      >
        {/* Brand Icon & Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-caramel-100/80 dark:bg-caramel-950/60 border border-caramel-200 dark:border-caramel-800/60 text-caramel-800 dark:text-caramel-300 text-xs font-bold tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-caramel-600" />
          <span>Specialty Coffee Inventory & B2B Procurement Platform</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-caramel-500 to-caramel-700 text-white flex items-center justify-center shadow-caramel-glow">
              <Coffee className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
              Café<span className="text-caramel-600 dark:text-caramel-400">Pulse</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-espresso-600 dark:text-cafe-300 max-w-md mx-auto leading-relaxed">
            Real-time stock tracking, barista floor PIN access, automated PAR reorders, and direct wholesale supplier bidding.
          </p>
        </div>

        {/* 2 Main Entry Gates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Gate 1: Café Management & Staff */}
          <Link
            href="/login"
            className="p-5 rounded-3xl bg-white dark:bg-espresso-900 border border-caramel-300 dark:border-espresso-700 hover:border-caramel-500 dark:hover:border-caramel-600 shadow-cafe-sm hover:shadow-cafe-md transition-all group text-left flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-caramel-500 to-caramel-700 text-white flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-caramel-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-600 transition-colors">
                Café Store & Baristas
              </h2>
              <p className="text-[11px] text-espresso-500 dark:text-cafe-400 mt-1 leading-snug">
                Store Admin sign in, + New café registration, or 4-digit barista floor PIN unlock.
              </p>
            </div>
          </Link>

          {/* Gate 2: Wholesale Suppliers & Vendors */}
          <Link
            href="/supplier/portal"
            className="p-5 rounded-3xl bg-white dark:bg-espresso-900 border border-emerald-300/80 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-600 shadow-cafe-sm hover:shadow-cafe-md transition-all group text-left flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-espresso-950 dark:text-cafe-50 group-hover:text-emerald-600 transition-colors">
                Wholesale Supplier Portal
              </h2>
              <p className="text-[11px] text-espresso-500 dark:text-cafe-400 mt-1 leading-snug">
                Vendor sign in, create vendor account, live café requirements & quote bidding.
              </p>
            </div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="pt-3 border-t border-cafe-200/80 dark:border-espresso-800/80 flex flex-wrap items-center justify-center gap-3 text-[11px] text-espresso-600 dark:text-cafe-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Real-time stock sync
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3 text-caramel-500" /> 4-digit floor PINs
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Building className="w-3 h-3 text-blue-500" /> Multi-branch network
          </span>
        </div>
      </motion.div>
    </main>
  );
}
