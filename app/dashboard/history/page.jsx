'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Edit3,
  Trash2,
  RefreshCw,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function HistoryAuditPage() {
  const toast = useToast();
  const { activityLogs, items, currentUser, role } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'RESTOCKED' | 'QUANTITY_ADJUSTED' | 'CREATED' | 'UPDATED' | 'DELETED'
  const [selectedRange, setSelectedRange] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      (log.itemName && log.itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.detail && log.detail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || log.type === selectedType;

    let matchesRange = true;
    if (selectedRange !== 'ALL') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);

      if (selectedRange === 'TODAY') {
        matchesRange = diffDays < 1;
      } else if (selectedRange === 'WEEK') {
        matchesRange = diffDays <= 7;
      } else if (selectedRange === 'MONTH') {
        matchesRange = diffDays <= 30;
      }
    }

    return matchesSearch && matchesType && matchesRange;
  });

  const restockCount = activityLogs.filter((l) => l.type === 'RESTOCKED').length;
  const usageCount = activityLogs.filter((l) => l.type === 'QUANTITY_ADJUSTED').length;
  const editCount = activityLogs.filter((l) => l.type === 'UPDATED' || l.type === 'CREATED').length;

  const handleExportHistoryCsv = () => {
    try {
      const headers = ['Timestamp', 'Event Type', 'Item Name', 'Details', 'Action By'];
      const rows = filteredLogs.map((l) => [
        `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
        `"${l.type}"`,
        `"${(l.itemName || '').replace(/"/g, '""')}"`,
        `"${(l.detail || '').replace(/"/g, '""')}"`,
        `"${(l.user || 'Café Lead').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cafepulse_history_audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('History audit report downloaded', 'CSV Exported');
    } catch (e) {
      toast.error('Failed to export history log', 'Error');
    }
  };

  const getBadgeForType = (type) => {
    switch (type) {
      case 'RESTOCKED':
        return {
          icon: ArrowUpRight,
          label: 'Stock In / Replenished',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700',
        };
      case 'QUANTITY_ADJUSTED':
        return {
          icon: ArrowDownLeft,
          label: 'Stock Out / Consumed',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
          iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700',
        };
      case 'CREATED':
        return {
          icon: PlusCircle,
          label: 'New Product Added',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
          iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700',
        };
      case 'UPDATED':
        return {
          icon: Edit3,
          label: 'Product Details Edited',
          badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
          iconBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700',
        };
      case 'DELETED':
        return {
          icon: Trash2,
          label: 'Product Removed',
          badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/50',
          iconBg: 'bg-red-100 dark:bg-red-950/60 text-red-700',
        };
      default:
        return {
          icon: Clock,
          label: 'Stock Event',
          badgeClass: 'bg-cafe-100 text-espresso-800 dark:bg-espresso-800 dark:text-cafe-200 border-cafe-200',
          iconBg: 'bg-cafe-100 dark:bg-espresso-800 text-espresso-700',
        };
    }
  };

  const TYPE_FILTERS = [
    { id: 'ALL', label: 'All Activities' },
    { id: 'RESTOCKED', label: '🟢 Stock In' },
    { id: 'QUANTITY_ADJUSTED', label: '🟡 Stock Out' },
    { id: 'CREATED', label: '🔵 New Items' },
    { id: 'UPDATED', label: '🟠 Modified' },
    { id: 'DELETED', label: '🔴 Removed' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              History & Activity Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-caramel-100 text-caramel-800 dark:bg-caramel-950/60 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800/60">
              {activityLogs.length} Total Actions Logged
            </span>
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Chronological audit trail of all stock movements, barcode additions, shift usage (-1), and edits.
          </p>
        </div>

        <button
          onClick={handleExportHistoryCsv}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Activity (CSV)</span>
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Replenishments (Stock In)
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {restockCount} Events
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Stock Usage / Adjustments
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {usageCount} Events
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800/40">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-caramel-600 dark:text-caramel-400">
              Catalogue Modifications
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {editCount} Events
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-caramel-50 dark:bg-caramel-950/50 text-caramel-600 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/40">
            <Edit3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-cafe-100/70 dark:bg-espresso-900/60 border border-cafe-200/60 dark:border-espresso-800/60">
          {TYPE_FILTERS.map((tab) => {
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-cafe-sm font-bold'
                    : 'text-espresso-600 dark:text-cafe-400 hover:text-espresso-900 dark:hover:text-cafe-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-cafe-50 dark:bg-espresso-900/60 px-3 py-1.5 rounded-xl border border-cafe-200 dark:border-espresso-700">
            <Calendar className="w-3.5 h-3.5 text-caramel-600" />
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-espresso-800 dark:text-cafe-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today Only</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-espresso-500 dark:text-cafe-400">
            Showing <strong className="text-espresso-950 dark:text-cafe-100 font-bold">{filteredLogs.length}</strong> records
          </span>
        </div>
      </div>

      {/* Main Timeline Card List */}
      <div className="bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 p-6 shadow-cafe-sm">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-espresso-300 dark:text-espresso-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
              No audit logs found
            </h3>
            <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 max-w-sm mx-auto">
              No activity logs match your active filters. Try clearing search or selecting &apos;All Activities&apos;.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-cafe-200 dark:border-espresso-800 space-y-6">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, index) => {
                const badgeInfo = getBadgeForType(log.type);
                const IconComponent = badgeInfo.icon;

                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    className="relative group"
                  >
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[35px] top-1.5 w-7 h-7 rounded-xl bg-white dark:bg-espresso-900 border border-cafe-200 dark:border-espresso-700 flex items-center justify-center shadow-sm">
                      <IconComponent className="w-3.5 h-3.5 text-caramel-600 dark:text-caramel-400" />
                    </div>

                    {/* Content Card */}
                    <div className="p-4 rounded-2xl bg-cafe-50/60 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800 hover:border-caramel-300 dark:hover:border-espresso-700 transition-colors space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeInfo.badgeClass}`}
                          >
                            {badgeInfo.label}
                          </span>
                          <h4 className="text-sm font-bold text-espresso-950 dark:text-cafe-50">
                            {log.itemName}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-espresso-500 dark:text-cafe-400">
                          <Clock className="w-3 h-3 text-espresso-400" />
                          <span>{formatDate(log.timestamp)}</span>
                          <span className="text-espresso-300 dark:text-espresso-700">•</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <p className="text-xs text-espresso-700 dark:text-cafe-300 leading-relaxed">
                        {log.detail}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-espresso-400 dark:text-cafe-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          <span>Action by: <strong className="text-espresso-800 dark:text-cafe-200 font-semibold">{log.user || 'Café Manager'}</strong></span>
                        </div>
                        {log.delta && (
                          <span className="font-mono font-bold text-xs text-espresso-950 dark:text-cafe-50 bg-white dark:bg-espresso-800 px-2 py-0.5 rounded-lg border border-cafe-200 dark:border-espresso-700">
                            {log.delta}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Linked Workflow Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <Link
          href="/dashboard/inventory"
          className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-caramel-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-caramel-600 transition-colors">
                Want to view or adjust items?
              </p>
              <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                Go to All Items & Stock Catalogue &rarr;
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href={['admin', 'manager', 'auditor'].includes(currentUser?.role || role) ? '/dashboard/analytics' : '/dashboard'}
          className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-emerald-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-emerald-600 transition-colors">
                {['admin', 'manager', 'auditor'].includes(currentUser?.role || role)
                  ? 'View Financial & Valuation Charts?'
                  : 'Return to Store Overview?'}
              </p>
              <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                {['admin', 'manager', 'auditor'].includes(currentUser?.role || role)
                  ? 'Go to Stock Value & Costs →'
                  : 'Go to Main Store Overview →'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
