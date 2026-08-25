'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  AlertTriangle,
  Shield,
  Coffee,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function Header({
  onOpenSidebar,
  searchQuery = '',
  onSearchChange,
  lowStockItems = [],
  outOfStockItems = [],
  currentUser,
  role = 'manager',
}) {
  const [isDark, setIsDark] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cafepulse_theme');
      if (savedTheme === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('cafepulse_theme', 'dark'); } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('cafepulse_theme', 'light'); } catch (e) {}
    }
  };

  const totalAlerts = lowStockItems.length + outOfStockItems.length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#140F0D]/80 backdrop-blur-md border-b border-cafe-200/80 dark:border-espresso-800/80 transition-colors">
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-espresso-700 dark:text-cafe-200 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-sm hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
            <input
              type="text"
              placeholder="Search items, SKU, categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-cafe-50/80 dark:bg-espresso-900/60 border border-cafe-200/80 dark:border-espresso-700/80 text-xs text-espresso-900 dark:text-cafe-50 placeholder:text-espresso-400 focus:outline-none focus:ring-2 focus:ring-caramel-500/30 focus:border-caramel-500 transition-all"
            />
          </div>

          {/* Active Café Location Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-caramel-500/10 dark:bg-caramel-950/40 border border-caramel-300/60 dark:border-caramel-800/50">
            <div className="w-6 h-6 rounded-lg bg-caramel-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-extrabold text-espresso-950 dark:text-cafe-50 leading-tight">
                {currentUser?.cafeName || 'Specialty Artisan Café'}
              </p>
              <p className="text-[10px] font-medium text-espresso-500 dark:text-espresso-400 leading-none mt-0.5">
                {currentUser?.branchName || 'Main Flagship Branch'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Role Badge, Dark Mode, Notifications */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Role Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold shadow-sm ${
              currentUser?.role === 'admin'
                ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-300/80 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                : currentUser?.role === 'manager'
                ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300/80 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                : currentUser?.role === 'head_barista'
                ? 'bg-caramel-50/90 dark:bg-caramel-950/60 border-caramel-300/80 dark:border-caramel-800 text-caramel-950 dark:text-caramel-200'
                : currentUser?.role === 'barista'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300/80 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-purple-50/90 dark:bg-purple-950/60 border-purple-300/80 dark:border-purple-800 text-purple-950 dark:text-purple-200'
            }`}
            title={
              currentUser?.role === 'admin'
                ? 'Store Administrator: Full authority over inventory, suppliers, financials, PINs, and team roles.'
                : `Role "${currentUser?.roleLabel || currentUser?.role}" managed by Store Administrator.`
            }
          >
            {currentUser?.role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : currentUser?.role === 'manager' ? (
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : currentUser?.role === 'head_barista' ? (
              <Coffee className="w-3.5 h-3.5 text-caramel-600 dark:text-caramel-400" />
            ) : currentUser?.role === 'barista' ? (
              <Coffee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
            <span className="hidden md:inline">
              {currentUser?.roleLabel || (currentUser?.role === 'admin' ? 'Store Admin & General Manager' : 'Staff Member')}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                  : currentUser?.role === 'manager'
                  ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                  : currentUser?.role === 'head_barista'
                  ? 'bg-caramel-200 text-caramel-900 dark:bg-caramel-900 dark:text-caramel-200'
                  : currentUser?.role === 'barista'
                  ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                  : 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
              }`}
            >
              {currentUser?.role === 'admin'
                ? 'Admin'
                : currentUser?.role === 'manager'
                ? 'Manager'
                : currentUser?.role === 'head_barista'
                ? 'Head Barista'
                : currentUser?.role === 'barista'
                ? 'Barista'
                : currentUser?.role === 'auditor'
                ? 'Auditor'
                : 'Staff'}
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-2xl bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200/80 dark:border-espresso-700 text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors shadow-sm"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-caramel-400" /> : <Moon className="w-4 h-4 text-espresso-700" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-2xl bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200/80 dark:border-espresso-700 text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                  {totalAlerts}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-cafe-xl p-4 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-cafe-100 dark:border-espresso-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-espresso-950 dark:text-cafe-50">
                          Stock Notifications
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel-100 text-caramel-800 dark:bg-caramel-950 dark:text-caramel-300">
                          {totalAlerts} Urgent
                        </span>
                      </div>
                      <Link
                        href={['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] font-bold text-caramel-600 hover:underline"
                      >
                        {['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? 'Open Planner' : 'View Stock'}
                      </Link>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {outOfStockItems.map((item) => (
                        <Link
                          key={item.id}
                          href={['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
                          onClick={() => setIsNotificationsOpen(false)}
                          className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs flex items-center justify-between hover:bg-red-100/70 dark:hover:bg-red-900/50 transition-all hover:scale-[1.01] cursor-pointer group shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-espresso-950 dark:text-cafe-100 truncate group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-red-700 dark:text-red-400 font-bold">
                                Out of Stock (0 {item.unit}) • Target PAR: {item.parLevel || 20}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-white/80 dark:bg-red-900/80 px-2.5 py-1 rounded-xl border border-red-200 dark:border-red-800 shrink-0 ml-2 group-hover:bg-red-600 group-hover:text-white transition-colors">
                            {['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? 'Reorder \u2192' : 'View \u2192'}
                          </span>
                        </Link>
                      ))}

                      {lowStockItems.map((item) => (
                        <Link
                          key={item.id}
                          href={['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? '/dashboard/reorder' : '/dashboard/inventory?status=lowstock'}
                          onClick={() => setIsNotificationsOpen(false)}
                          className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs flex items-center justify-between hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-all hover:scale-[1.01] cursor-pointer group shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-espresso-950 dark:text-cafe-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                                Low Stock: {item.quantity}/{item.reorderLevel} {item.unit} • Deficit: {Math.max(1, (item.parLevel || 20) - item.quantity)}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-white/80 dark:bg-amber-900/80 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 shrink-0 ml-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            {['admin', 'manager', 'head_barista'].includes(currentUser?.role || role) ? 'Restock \u2192' : 'View \u2192'}
                          </span>
                        </Link>
                      ))}

                      {totalAlerts === 0 && (
                        <div className="py-6 text-center text-xs text-espresso-500">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          <p className="font-bold text-espresso-900 dark:text-cafe-100">All Stock Levels Healthy!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
