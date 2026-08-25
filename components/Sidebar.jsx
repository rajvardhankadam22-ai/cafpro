'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Tags,
  RefreshCw,
  BarChart3,
  Coffee,
  Sparkles,
  Database,
  ChevronRight,
  LogOut,
  AlertTriangle,
  X,
  ExternalLink,
  History,
  Clock,
  Truck,
  FileText,
  Shield,
  Building,
  Users,
  RotateCcw,
  Store,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/components/Toast';

export default function Sidebar({
  isOpen,
  onClose,
  lowStockCount = 0,
  outOfStockCount = 0,
  pendingPoCount = 0,
  pendingAppCount = 0,
  currentUser = null,
  role = 'manager',
  onLogout = () => {},
}) {
  const pathname = usePathname();
  const toast = useToast();
  const isLiveFirebase = isFirebaseConfigured();
  const alertCount = lowStockCount + outOfStockCount;

  const navLinks = [
    {
      name: 'Store Overview',
      desc: 'Summary & quick alerts',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'All Items & Stock',
      desc: 'See stock & use -1 on shift',
      href: '/dashboard/inventory',
      icon: Package,
      badge: null,
    },
    {
      name: 'Low Stock & Reorder',
      desc: 'Items running out soon',
      href: '/dashboard/reorder',
      icon: RefreshCw,
      badge: alertCount > 0 ? `${alertCount} Low` : null,
      badgeColor: outOfStockCount > 0 ? 'bg-red-500' : 'bg-amber-500',
    },
    {
      name: 'Orders & Deliveries',
      desc: 'Send orders & check in boxes',
      href: '/dashboard/orders',
      icon: Truck,
      badge: pendingPoCount > 0 ? `${pendingPoCount} on way` : null,
      badgeColor: 'bg-amber-500',
    },
    {
      name: 'Suppliers & Quotes',
      desc: 'Your vendors & price offers',
      href: '/dashboard/vendors',
      icon: Building,
      badge: pendingAppCount > 0 ? `${pendingAppCount} New` : null,
      badgeColor: 'bg-emerald-500',
    },
    {
      name: 'Categories',
      desc: 'Coffee, Milk, Syrups, Bakery',
      href: '/dashboard/categories',
      icon: Tags,
      badge: null,
    },
    {
      name: 'Stock Value & Costs',
      desc: 'Total worth (₹) & spending',
      href: '/dashboard/analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      name: 'History & Activity',
      desc: 'Who changed what and when',
      href: '/dashboard/history',
      icon: Clock,
      badge: null,
    },
    {
      name: 'Staff & PINs',
      desc: 'Barista accounts & login PINs',
      href: '/dashboard/team',
      icon: Users,
      badge: null,
    },
  ];

  const userRole = currentUser?.role || role || 'admin';

  const visibleNavLinks = navLinks.filter((link) => {
    if (userRole === 'admin') return true;
    if (userRole === 'manager') return true;
    if (userRole === 'head_barista') {
      return ['/dashboard', '/dashboard/inventory', '/dashboard/reorder', '/dashboard/orders', '/dashboard/categories', '/dashboard/vendors', '/dashboard/history', '/dashboard/team'].includes(link.href);
    }
    if (userRole === 'barista') {
      return ['/dashboard', '/dashboard/inventory', '/dashboard/orders', '/dashboard/history'].includes(link.href);
    }
    if (userRole === 'auditor') {
      return ['/dashboard', '/dashboard/inventory', '/dashboard/analytics', '/dashboard/history'].includes(link.href);
    }
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-espresso-950/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#140F0D] text-cafe-50 flex flex-col border-r border-espresso-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-espresso-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-caramel-500 to-caramel-700 flex items-center justify-center shadow-caramel-glow transition-transform group-hover:scale-105">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-cafe-50 tracking-tight font-sans">
                  CaféPulse
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-caramel-500/20 text-caramel-400 border border-caramel-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-espresso-400 font-medium">
                Enterprise Operations
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-espresso-400 hover:text-cafe-50 hover:bg-espresso-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Café Location Card */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-3 rounded-2xl bg-espresso-950/80 border border-espresso-800 flex items-center justify-between gap-2 shadow-inner">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-caramel-600 to-amber-800 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-cafe-50 truncate leading-tight">
                  {currentUser?.cafeName || 'Artisan Specialty Café'}
                </p>
                <p className="text-[10px] text-espresso-400 truncate leading-none mt-1">
                  {currentUser?.branchName || 'Main Flagship Branch'}
                </p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-caramel-500/20 text-caramel-300 border border-caramel-500/30 shrink-0">
              {currentUser?.branchCode || 'BLR-01'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-espresso-500">
            {userRole === 'barista' ? 'Floor Operations' : userRole === 'auditor' ? 'Auditing & Valuation' : 'Operations & Supply Chain'}
          </p>

          {visibleNavLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch={true}
                onClick={onClose}
                className={`relative flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-caramel-600 to-caramel-700 text-white font-bold shadow-caramel-glow'
                    : 'text-espresso-300 hover:text-cafe-100 hover:bg-espresso-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-caramel-400'
                    }`}
                  />
                  <div className="min-w-0 text-left">
                    <span className="truncate block font-bold leading-tight text-xs">{link.name}</span>
                    {link.desc && (
                      <span className={`text-[10px] truncate block leading-none mt-0.5 ${isActive ? 'text-caramel-100 font-normal' : 'text-espresso-400 group-hover:text-espresso-300 font-normal'}`}>
                        {link.desc}
                      </span>
                    )}
                  </div>
                </div>

                {link.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 ml-2 ${
                      link.badgeColor || 'bg-caramel-500'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Database & Active Role Footer */}
        <div className="p-4 border-t border-espresso-800/80">

          {/* User Profile / Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-caramel-600 to-amber-700 flex items-center justify-center font-bold text-xs text-white uppercase">
                {currentUser?.email ? currentUser.email.substring(0, 2) : 'CP'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-cafe-100 truncate">
                  {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Store Admin')}
                </p>
                <p className="text-[10px] text-amber-400 font-bold truncate">
                  {currentUser?.roleLabel || (currentUser?.role === 'admin' ? 'Store Admin & General Manager' : currentUser?.role || 'Store Administrator')}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-espresso-400 hover:text-red-400 hover:bg-espresso-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
