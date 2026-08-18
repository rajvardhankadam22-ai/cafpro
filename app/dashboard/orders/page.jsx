'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Building,
  Package,
  ArrowRight,
  Sparkles,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import PagePurposeBanner from '@/components/PagePurposeBanner';

export default function PurchaseOrdersPage() {
  const toast = useToast();
  const {
    purchaseOrders,
    items,
    openCreatePo,
    openGoodsReceipt,
    role,
  } = useDashboard();

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Guaranteed deduplication of purchase orders
  const uniquePurchaseOrders = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const po of purchaseOrders) {
      if (po && po.id && !seen.has(po.id)) {
        seen.add(po.id);
        list.push(po);
      }
    }
    return list;
  }, [purchaseOrders]);

  const filteredOrders = uniquePurchaseOrders.filter((po) => {
    const matchesSearch =
      !searchQuery ||
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.notes && po.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'ALL' || po.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = uniquePurchaseOrders.filter((po) => po.status === 'PENDING_DELIVERY').length;
  const deliveredCount = uniquePurchaseOrders.filter((po) => po.status === 'DELIVERED').length;
  const totalDeliveredValue = uniquePurchaseOrders
    .filter((po) => po.status === 'DELIVERED')
    .reduce((acc, po) => acc + (Number(po.totalCost) || Number(po.totalEstimatedCost) || 0), 0);

  const handleExportPoCsv = () => {
    try {
      const headers = ['PO Number', 'Supplier', 'Status', 'Item Count', 'Total Cost (INR ₹)', 'Created Date', 'Received Date', 'Received By'];
      const rows = filteredOrders.map((po) => [
        `"${po.poNumber}"`,
        `"${po.supplierName}"`,
        `"${po.status}"`,
        (po.items || []).length,
        (po.totalCost || po.totalEstimatedCost || 0).toFixed(2),
        `"${formatDate(po.createdAt)}"`,
        `"${po.receivedAt ? formatDate(po.receivedAt) : 'Pending'}"`,
        `"${po.receivedBy || 'N/A'}"`,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cafepulse_purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PO ledger exported to CSV', 'Download Complete');
    } catch (e) {
      toast.error('Failed to export PO CSV', 'Error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_DELIVERY':
        return {
          label: 'Pending Delivery',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 animate-pulse',
        };
      case 'DELIVERED':
        return {
          label: 'Delivered & Reconciled',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        };
      case 'PARTIAL':
        return {
          label: 'Partially Received',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-cafe-100 text-espresso-800 border-cafe-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              Orders & Deliveries
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-caramel-100 text-caramel-800 dark:bg-caramel-950/60 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800/60">
              Supplier Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Manage purchase orders, track incoming supplier shipments, and reconcile delivered boxes directly into stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPoCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-espresso-700 dark:text-cafe-200 bg-white dark:bg-espresso-900 border border-cafe-200 dark:border-espresso-700 hover:bg-cafe-50 transition-all shadow-cafe-sm"
          >
            <Download className="w-4 h-4 text-espresso-500" />
            <span>Export CSV</span>
          </button>

          {role !== 'barista' && (
            <button
              onClick={() => openCreatePo()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Page Purpose Banner */}
      <PagePurposeBanner
        purpose="Complete lifecycle management for vendor procurement. Issue official purchase orders, monitor transit dispatches, and receive delivery parcels with instant stock incrementation."
        badgeText="Orders & Deliveries Purpose"
        accentColor="amber"
        primaryAction={{
          label: "+ Create New Order",
          onClick: () => openCreatePo(),
        }}
        actions={[
          {
            title: "Issue Purchase Orders",
            desc: "Pick a vendor to auto-populate low items, negotiate line item prices, and generate formal PO reference codes.",
          },
          {
            title: "Track Dispatch Status",
            desc: "Monitor which supplier shipments are in transit, expected arrival dates, and courier tracking details.",
          },
          {
            title: "Receive Delivery",
            desc: "When packages arrive at the café door, click 'Receive Delivery' to automatically credit inventory counts.",
          },
          {
            title: "Historical PO Audit",
            desc: "Download complete procurement histories, spending ledgers, and receiver sign-off logs as CSV.",
          },
        ]}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Shipments
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {pendingCount} Orders
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800/40">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Reconciled Deliveries
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {deliveredCount} Completed
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-caramel-600 dark:text-caramel-400">
              Delivered Goods Value
            </p>
            <p className="text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 mt-1">
              {formatCurrency(totalDeliveredValue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-caramel-50 dark:bg-caramel-950/50 text-caramel-600 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/40">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-cafe-100/70 dark:bg-espresso-900/60 border border-cafe-200/60 dark:border-espresso-800/60">
          {[
            { id: 'ALL', label: `All Orders (${purchaseOrders.length})` },
            { id: 'PENDING_DELIVERY', label: `🟡 Pending Delivery (${pendingCount})` },
            { id: 'DELIVERED', label: `🟢 Delivered (${deliveredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === tab.id
                  ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-cafe-sm font-bold'
                  : 'text-espresso-600 dark:text-cafe-400 hover:text-espresso-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold text-espresso-500 dark:text-cafe-400">
          Showing <strong className="text-espresso-950 dark:text-cafe-100 font-bold">{filteredOrders.length}</strong> purchase orders
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm">
            <FileText className="w-12 h-12 text-espresso-300 dark:text-espresso-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
              No purchase orders found
            </h3>
            <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-1 max-w-sm mx-auto">
              Draft a new purchase order using the button above or replenishment planner.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredOrders.map((po) => {
                const statusBadge = getStatusBadge(po.status);
                const isPending = po.status === 'PENDING_DELIVERY';

                return (
                  <motion.div
                    key={po.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-3xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cafe-100 dark:border-espresso-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-caramel-50 dark:bg-caramel-950/50 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200/60 dark:border-caramel-800/40">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                              {po.supplierName}
                            </h3>
                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-cafe-100 dark:bg-espresso-800 text-espresso-800 dark:text-cafe-200">
                              {po.poNumber}
                            </span>
                          </div>
                          <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-0.5">
                            Created {formatDate(po.createdAt)} • {(po.items || []).length} items ordered
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.badgeClass}`}>
                          {statusBadge.label}
                        </span>

                        {isPending && (
                          <button
                            onClick={() => openGoodsReceipt(po)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Receive Delivery</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ordered Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(po.items || []).map((item, idx) => (
                        <div
                          key={item.itemId || idx}
                          className="p-3 rounded-2xl bg-cafe-50/70 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-espresso-950 dark:text-cafe-50 truncate max-w-[160px]">
                              {item.itemName}
                            </p>
                            <p className="text-[10px] text-espresso-400 font-mono">
                              {item.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-espresso-950 dark:text-cafe-100">
                              {po.status === 'DELIVERED' ? `${item.receivedQty || item.orderedQty} ${item.unit}` : `${item.orderedQty} ${item.unit}`}
                            </p>
                            <p className="text-[10px] text-espresso-500">
                              @{formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-espresso-600 dark:text-cafe-400 border-t border-cafe-100 dark:border-espresso-800/60">
                      <div>
                        {po.notes && <p className="italic">&ldquo;{po.notes}&rdquo;</p>}
                        {po.receivedBy && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                            ✓ Inspected & received by: {po.receivedBy} on {formatDate(po.receivedAt)}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] uppercase font-bold text-espresso-400">Total Order Value: </span>
                        <strong className="text-sm font-extrabold text-espresso-950 dark:text-cafe-50 font-mono">
                          {formatCurrency(po.totalCost || po.totalEstimatedCost || 0)}
                        </strong>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Linked Workflow Quick Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <Link
          href="/dashboard/reorder"
          className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-amber-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-amber-600 transition-colors">
                Need to calculate PAR shortages?
              </p>
              <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                Open Low Stock & Reorder Planner &rarr;
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/vendors"
          className="p-4 rounded-2xl bg-white dark:bg-[#181310] border border-cafe-200/80 dark:border-espresso-800 shadow-cafe-sm hover:border-emerald-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 group-hover:text-emerald-600 transition-colors">
                Manage Roasters & Rate Books?
              </p>
              <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                Open Suppliers & Quotes Directory &rarr;
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
