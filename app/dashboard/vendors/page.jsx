'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Edit3,
  Trash2,
  Truck,
  Package,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  Layers,
  Sparkles,
  IndianRupee,
  X,
  CheckCircle2,
  TrendingDown,
  Inbox,
  Share2,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function VendorsPage() {
  const {
    vendors = [],
    items = [],
    purchaseOrders = [],
    supplierApplications = [],
    openAddVendor,
    openEditVendor,
    deleteVendor,
    mapVendorPrice,
    unmapVendorPrice,
    approveSupplierApplication,
    rejectSupplierApplication,
    openCreatePo,
    role,
  } = useDashboard();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' | 'applications' | 'matrix'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals state
  const [selectedVendorForPriceBook, setSelectedVendorForPriceBook] = useState(null);

  // Price Book Mapping Form State
  const [priceFormData, setPriceFormData] = useState({
    itemId: '',
    vendorItemName: '',
    vendorSku: '',
    unitPrice: '',
    isPreferred: false,
    leadTimeDays: '2',
    notes: '',
  });

  const pendingApps = supplierApplications.filter((a) => a.status === 'PENDING');

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q)) ||
      (v.paymentTerms && v.paymentTerms.toLowerCase().includes(q))
    );
  });

  // Helper to find all catalogue items supplied by a vendor
  const getVendorSuppliedItems = (vendorName) => {
    if (!vendorName) return [];
    return items.filter((item) => {
      const matchDefault =
        item.supplier &&
        item.supplier.toLowerCase().trim() === vendorName.toLowerCase().trim();
      const matchMapping = (item.vendorMappings || []).some(
        (vm) =>
          vm.vendorName &&
          vm.vendorName.toLowerCase().trim() === vendorName.toLowerCase().trim()
      );
      return matchDefault || matchMapping;
    });
  };

  // Helper to get active POs for a vendor
  const getVendorActivePos = (vendorName) => {
    if (!vendorName) return [];
    return purchaseOrders.filter(
      (po) =>
        po.supplierName &&
        po.supplierName.toLowerCase().trim() === vendorName.toLowerCase().trim() &&
        po.status === 'PENDING_DELIVERY'
    );
  };

  const totalPriceAgreements = items.reduce(
    (acc, curr) => acc + (curr.vendorMappings ? curr.vendorMappings.length : 0),
    0
  );

  // Copy public supplier onboarding link
  const handleCopyPublicLink = () => {
    const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/supplier/portal`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success('Public supplier onboarding link copied to clipboard!', 'Link Copied');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Open Add Product Price Book Modal for a vendor
  const handleOpenAddPriceAgreement = (vendor) => {
    setSelectedVendorForPriceBook(vendor);
    const firstItem = items[0];
    setPriceFormData({
      itemId: firstItem ? firstItem.id : '',
      vendorItemName: firstItem ? firstItem.name : '',
      vendorSku: '',
      unitPrice: firstItem ? String(firstItem.unitPrice || '') : '',
      isPreferred: false,
      leadTimeDays: String(vendor.leadTimeDays || 2),
      notes: '',
    });
  };

  const handleItemSelectChange = (selectedId) => {
    const selectedItem = items.find((i) => i.id === selectedId);
    setPriceFormData((prev) => ({
      ...prev,
      itemId: selectedId,
      vendorItemName: selectedItem ? selectedItem.name : prev.vendorItemName,
      vendorSku: selectedItem ? `${selectedItem.sku}-V` : '',
      unitPrice: selectedItem ? String(selectedItem.unitPrice || '') : prev.unitPrice,
    }));
  };

  const handleSavePriceAgreement = async (e) => {
    e.preventDefault();
    if (!priceFormData.itemId || !selectedVendorForPriceBook) return;

    await mapVendorPrice(priceFormData.itemId, {
      vendorName: selectedVendorForPriceBook.name,
      vendorItemName: priceFormData.vendorItemName.trim(),
      vendorSku: priceFormData.vendorSku.trim().toUpperCase(),
      unitPrice: Number(priceFormData.unitPrice) || 0,
      isPreferred: Boolean(priceFormData.isPreferred),
      leadTimeDays: Number(priceFormData.leadTimeDays) || 2,
      notes: priceFormData.notes.trim(),
    });

    setSelectedVendorForPriceBook(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight font-sans">
              Suppliers & Price Quotes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-caramel-100 dark:bg-caramel-950/60 text-caramel-800 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800">
              {vendors.length} Active Supplier{vendors.length !== 1 ? 's' : ''}
            </span>
            {pendingApps.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 animate-pulse">
                📥 {pendingApps.length} New Price Offer{pendingApps.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 mt-1">
            Manage wholesale roasters, dairy vendors, price books, and incoming supplier catalog bids.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopyPublicLink}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-espresso-800 text-espresso-800 dark:text-cafe-100 border border-cafe-200 dark:border-espresso-700 hover:border-caramel-500 shadow-sm transition-all"
            title="Copy link to share with coffee roasters and suppliers on WhatsApp/Email"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-caramel-600" />}
            <span>{copiedLink ? 'Link Copied!' : '🔗 Share Sign-up Link'}</span>
          </button>

          {role !== 'barista' && (
            <button
              onClick={openAddVendor}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Proposals Notification Alert Banner */}
      {pendingApps.length > 0 && activeTab !== 'applications' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                📬 {pendingApps.length} New Supplier Proposal{pendingApps.length > 1 ? 's' : ''} Received!
              </p>
              <p className="text-[11px] text-emerald-300">
                Suppliers have submitted wholesale ingredient bids for your café from the public marketplace.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('applications')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm transition-all shrink-0 text-center"
          >
            Review Proposals ({pendingApps.length}) &rarr;
          </button>
        </div>
      )}

      {/* 3 Main Tabs */}
      <div className="flex items-center gap-2 border-b border-cafe-200 dark:border-espresso-800 pb-2">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-caramel-600 text-white shadow-caramel-glow'
              : 'text-espresso-600 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Active Suppliers ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'applications'
              ? 'bg-caramel-600 text-white shadow-caramel-glow'
              : 'text-espresso-600 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Supplier Proposals & Bids</span>
          {pendingApps.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'applications' ? 'bg-white text-caramel-800' : 'bg-emerald-500 text-white'
            }`}>
              {pendingApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-caramel-600 text-white shadow-caramel-glow'
              : 'text-espresso-600 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📊 Sourcing Price Matrix</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE REGISTERED SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {/* KPI Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/50">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
                  Active Suppliers
                </p>
                <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
                  {vendors.length} Vendors
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
                  Negotiated Price Books
                </p>
                <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
                  {totalPriceAgreements} Contract Items
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-800/50">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
                  Active Shipments in Transit
                </p>
                <p className="text-lg font-extrabold text-espresso-950 dark:text-cafe-50">
                  {purchaseOrders.filter((p) => p.status === 'PENDING_DELIVERY').length} Purchase Orders
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers by name, rep, city, or payment terms..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-white dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-2xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500 shadow-sm"
            />
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-espresso-900/30 rounded-3xl border border-cafe-200 dark:border-espresso-800 space-y-3">
              <Building className="w-12 h-12 text-espresso-300 mx-auto" />
              <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                No suppliers found
              </h3>
              <p className="text-xs text-espresso-500 max-w-sm mx-auto">
                {searchQuery ? `No vendors match "${searchQuery}".` : 'Share your public onboarding link or register your first vendor.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredVendors.map((vendor) => {
                const suppliedItems = getVendorSuppliedItems(vendor.name);
                const activePos = getVendorActivePos(vendor.name);
                const isExpanded = expandedVendorId === vendor.id;

                return (
                  <motion.div
                    key={vendor.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-espresso-900/50 rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-cafe-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50 truncate">
                              {vendor.name}
                            </h3>
                            {activePos.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                                🚚 {activePos.length} In Transit
                              </span>
                            )}
                          </div>

                          {vendor.city && (
                            <p className="text-xs text-espresso-500 dark:text-cafe-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-caramel-600" />
                              <span>{vendor.city}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {role !== 'barista' && (
                            <>
                              <button
                                onClick={() => openEditVendor(vendor)}
                                className="p-1.5 rounded-lg text-espresso-400 hover:text-caramel-600 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
                                title="Edit Supplier Profile"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove supplier ${vendor.name}?`)) {
                                    deleteVendor(vendor.id, vendor.name);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-espresso-400 hover:text-red-600 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
                                title="Delete Supplier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <div className="px-2.5 py-1 rounded-xl bg-cafe-100 dark:bg-espresso-800/80 text-espresso-800 dark:text-cafe-200 border border-cafe-200 dark:border-espresso-700 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3 text-caramel-600" />
                          <span>{vendor.leadTimeDays || 2} Days Lead Time</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-cafe-100 dark:bg-espresso-800/80 text-espresso-800 dark:text-cafe-200 border border-cafe-200 dark:border-espresso-700 flex items-center gap-1.5 font-medium">
                          <CreditCard className="w-3 h-3 text-emerald-600" />
                          <span>{vendor.paymentTerms || 'Net 15'}</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-caramel-50 dark:bg-caramel-950/60 text-caramel-800 dark:text-caramel-300 border border-caramel-200/60 dark:border-caramel-800/60 flex items-center gap-1.5 font-bold">
                          <Package className="w-3 h-3" />
                          <span>{suppliedItems.length} Products in Price Book</span>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="p-3 rounded-2xl bg-cafe-50/80 dark:bg-espresso-900/70 border border-cafe-200/70 dark:border-espresso-800 space-y-1.5 text-xs">
                        {vendor.contactPerson && (
                          <p className="text-espresso-800 dark:text-cafe-200 font-semibold">
                            Rep: <strong>{vendor.contactPerson}</strong>
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-[11px] text-espresso-600 dark:text-cafe-400">
                          {vendor.phone && (
                            <a
                              href={`tel:${vendor.phone}`}
                              className="flex items-center gap-1 font-mono hover:text-caramel-600 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{vendor.phone}</span>
                            </a>
                          )}
                          {vendor.email && (
                            <a
                              href={`mailto:${vendor.email}`}
                              className="flex items-center gap-1 hover:text-caramel-600 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              <span>{vendor.email}</span>
                            </a>
                          )}
                        </div>
                        {vendor.notes && (
                          <p className="text-[10px] text-espresso-500 dark:text-cafe-400 italic pt-1 border-t border-cafe-200/50 dark:border-espresso-800/50">
                            "{vendor.notes}"
                          </p>
                        )}
                      </div>

                      {/* Expandable Price Book Catalogue */}
                      <div>
                        <div className="flex items-center justify-between py-1">
                          <button
                            type="button"
                            onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-espresso-700 dark:text-cafe-300 hover:text-caramel-600 transition-colors"
                          >
                            <Tag className="w-3.5 h-3.5 text-caramel-600" />
                            <span>Price Book Catalogue ({suppliedItems.length} items)</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {role !== 'barista' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddPriceAgreement(vendor)}
                              className="text-[11px] font-bold text-caramel-700 dark:text-caramel-300 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Add Item</span>
                            </button>
                          )}
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 space-y-1.5 overflow-hidden"
                            >
                              {suppliedItems.length === 0 ? (
                                <div className="p-3 text-center rounded-xl bg-cafe-50 dark:bg-espresso-800/40 border border-cafe-200 text-xs text-espresso-500">
                                  No products mapped to {vendor.name} yet. Click <strong>"+ Add Item"</strong> above to map products.
                                </div>
                              ) : (
                                suppliedItems.map((item) => {
                                  const mapping = (item.vendorMappings || []).find(
                                    (vm) =>
                                      vm.vendorName &&
                                      vm.vendorName.toLowerCase().trim() === vendor.name.toLowerCase().trim()
                                  );
                                  const tradeName = mapping ? mapping.vendorItemName : item.name;
                                  const price = mapping && mapping.unitPrice > 0 ? mapping.unitPrice : item.unitPrice;
                                  const isPref = mapping ? mapping.isPreferred : item.supplier === vendor.name;

                                  return (
                                    <div
                                      key={item.id}
                                      className="p-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cafe-200/80 dark:border-espresso-700 flex items-center justify-between text-xs gap-2 shadow-xs"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-espresso-950 dark:text-cafe-50 truncate">
                                            {tradeName}
                                          </span>
                                          {isPref && (
                                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-0.5">
                                              <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                                              Preferred
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-espresso-500 dark:text-cafe-400 truncate">
                                          Master: <em>{item.name}</em> ({mapping?.vendorSku || item.sku})
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                          <p className="font-bold text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(price)}
                                          </p>
                                          <p className="text-[9px] text-espresso-400">per {item.unit}</p>
                                        </div>

                                        {mapping && role !== 'barista' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`Remove "${tradeName}" price agreement from ${vendor.name}?`)) {
                                                unmapVendorPrice(item.id, mapping.mappingId, vendor.name);
                                              }
                                            }}
                                            className="p-1 text-espresso-300 hover:text-red-600 transition-colors"
                                            title="Remove Price Agreement"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="p-3.5 bg-cafe-50/90 dark:bg-espresso-950/60 border-t border-cafe-200 dark:border-espresso-800 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-espresso-500 dark:text-cafe-400 font-medium">
                        {suppliedItems.length} Products in Price Book
                      </span>

                      {role !== 'barista' && (
                        <button
                          type="button"
                          onClick={() => openCreatePo(vendor.name, suppliedItems)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-caramel-600 hover:bg-caramel-700 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Issue PO to Vendor</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING SUPPLIER APPLICATIONS & SELF-REGISTRATION PROPOSALS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-caramel-50 dark:from-emerald-950/30 dark:to-caramel-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-emerald-glow">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-espresso-950 dark:text-cafe-50">
                  Open Supplier Onboarding Portal
                </h3>
                <p className="text-xs text-espresso-600 dark:text-cafe-400">
                  Suppliers self-register at <code className="px-1.5 py-0.5 rounded bg-white dark:bg-black font-mono text-[11px]">/supplier/register</code> and submit wholesale price bids.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyPublicLink}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-espresso-800 text-espresso-900 dark:text-cafe-50 border border-cafe-200 dark:border-espresso-700 hover:border-emerald-500 shadow-sm flex items-center gap-2 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share Application Link</span>
            </button>
          </div>

          {supplierApplications.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-espresso-900/30 rounded-3xl border border-cafe-200 dark:border-espresso-800 space-y-3">
              <Inbox className="w-12 h-12 text-espresso-300 mx-auto" />
              <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                No Supplier Proposals Yet
              </h3>
              <p className="text-xs text-espresso-500 max-w-sm mx-auto">
                Share your public onboarding link with roasters and suppliers to receive wholesale proposals.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {supplierApplications.map((app) => {
                const isPending = app.status === 'PENDING';
                const isApproved = app.status === 'APPROVED';
                const isRejected = app.status === 'REJECTED';
                const isExpanded = expandedAppId === app.id;

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      isPending
                        ? 'bg-white dark:bg-espresso-900/60 border-emerald-300 dark:border-emerald-800/80 shadow-md'
                        : isApproved
                        ? 'bg-cafe-50/50 dark:bg-espresso-900/30 border-cafe-200 dark:border-espresso-800 opacity-80'
                        : 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                            {app.companyName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel-100 dark:bg-caramel-950 text-caramel-800 dark:text-caramel-300 border border-caramel-200">
                            {app.category || 'Supplier'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                              : isApproved
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-espresso-600 dark:text-cafe-300 pt-1">
                          {app.contactPerson && <span>Rep: <strong>{app.contactPerson}</strong></span>}
                          {app.phone && (
                            <a href={`tel:${app.phone}`} className="flex items-center gap-1 font-mono hover:text-caramel-600">
                              <Phone className="w-3 h-3 text-caramel-600" />
                              <span>{app.phone}</span>
                            </a>
                          )}
                          {app.email && (
                            <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-caramel-600">
                              <Mail className="w-3 h-3 text-caramel-600" />
                              <span>{app.email}</span>
                            </a>
                          )}
                          {app.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-caramel-600" />
                              <span>{app.city}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-[11px] text-espresso-500 dark:text-cafe-400 pt-1 font-mono">
                          <span>Lead Time: <strong>{app.leadTimeDays || 2} Days</strong></span>
                          <span>•</span>
                          <span>Payment: <strong>{app.paymentTerms || 'Net 15'}</strong></span>
                          <span>•</span>
                          <span>GSTIN: <strong>{app.gstin || 'N/A'}</strong></span>
                          {app.minimumOrderValue > 0 && (
                            <>
                              <span>•</span>
                              <span>MOV: <strong>₹{app.minimumOrderValue}</strong></span>
                            </>
                          )}
                        </div>

                        {app.notes && (
                          <p className="text-[11px] text-espresso-600 dark:text-cafe-300 italic pt-1">
                            "{app.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {isPending && role !== 'barista' && (
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => approveSupplierApplication(app.id, app.companyName, app)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-glow flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Register</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Reject application from ${app.companyName}?`)) {
                                rejectSupplierApplication(app.id, app.companyName, app);
                              }
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quoted Items List */}
                    <div className="mt-4 pt-3 border-t border-cafe-100 dark:border-espresso-800">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-caramel-600" />
                          <span>Quoted Products ({app.quotedItems?.length || 0} items)</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                          className="text-[11px] font-bold text-caramel-600 hover:underline"
                        >
                          {isExpanded ? 'Hide Items' : 'View Quoted Items'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-2 overflow-hidden"
                          >
                            {app.quotedItems?.map((qi, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-2xl bg-cafe-50 dark:bg-espresso-800/80 border border-cafe-200 dark:border-espresso-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-espresso-950 dark:text-cafe-50">
                                      {qi.vendorTradeName || qi.masterItemName}
                                    </span>
                                    {qi.vendorSku && (
                                      <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-white dark:bg-black text-espresso-400">
                                        {qi.vendorSku}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                                    Mapped Store Item: <em>{qi.masterItemName}</em> • MOQ: {qi.moq || 1} {qi.unit || 'units'}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                                    {formatCurrency(qi.wholesalePrice)}
                                  </span>
                                  <p className="text-[9px] text-espresso-400">per {qi.unit || 'unit'}</p>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER SOURCING PRICE COMPARISON MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800">
            <h3 className="text-sm font-bold text-espresso-950 dark:text-cafe-50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-caramel-600" />
              <span>Multi-Vendor Price Comparison Matrix</span>
            </h3>
            <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-0.5">
              Compare contract rates, vendor trade titles, and lead times across all approved suppliers for every café ingredient.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const mappings = Array.isArray(item.vendorMappings) && item.vendorMappings.length > 0
                ? item.vendorMappings
                : item.supplier
                ? [{ mappingId: 'm-default', vendorName: item.supplier, vendorItemName: item.name, vendorSku: item.sku, unitPrice: item.unitPrice, isPreferred: true }]
                : [];

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-800 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-espresso-950 dark:text-cafe-50">
                        {item.name}
                      </h4>
                      <span className="font-mono text-[10px] text-espresso-400">
                        Master SKU: {item.sku} • In Stock: {item.quantity} {item.unit} • Current Base COGS: {formatCurrency(item.unitPrice)}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-caramel-100 dark:bg-caramel-950 text-caramel-800 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800">
                      {mappings.length} Supplier Quotes
                    </span>
                  </div>

                  {/* Suppliers Offering This Item */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {mappings.map((m) => (
                      <div
                        key={m.mappingId || m.vendorName}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-1 text-xs ${
                          m.isPreferred
                            ? 'bg-caramel-50/80 dark:bg-caramel-950/40 border-caramel-300 dark:border-caramel-800'
                            : 'bg-cafe-50/70 dark:bg-espresso-800/80 border-cafe-200 dark:border-espresso-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-espresso-950 dark:text-cafe-50 truncate">
                            {m.vendorName}
                          </span>
                          {m.isPreferred && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-0.5 shrink-0">
                              <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                              Preferred
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-espresso-500 dark:text-cafe-400 italic truncate">
                          "{m.vendorItemName || item.name}"
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-cafe-100 dark:border-espresso-700 mt-1">
                          <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(m.unitPrice)}
                          </span>

                          <button
                            type="button"
                            onClick={() => openCreatePo(m.vendorName, [item])}
                            className="text-[10px] font-bold text-caramel-600 hover:underline"
                          >
                            Order from {m.vendorName.split(' ')[0]} &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Product to Vendor's Price Book */}
      <AnimatePresence>
        {selectedVendorForPriceBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVendorForPriceBook(null)}
              className="fixed inset-0 bg-espresso-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-cafe-xl overflow-hidden z-10 p-6 sm:p-7 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                      Add Product to Price Book
                    </h3>
                    <p className="text-xs text-espresso-500 dark:text-cafe-400">
                      Supplier: <strong className="text-caramel-600">{selectedVendorForPriceBook.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVendorForPriceBook(null)}
                  className="text-espresso-400 hover:text-espresso-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePriceAgreement} className="space-y-3.5">
                {/* Item Select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                    Select Store Master Item *
                  </label>
                  <select
                    value={priceFormData.itemId}
                    onChange={(e) => handleItemSelectChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none text-espresso-950 dark:text-cafe-50"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.sku}) - Current Store Cost: ₹{i.unitPrice} / {i.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor Trade Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                    {selectedVendorForPriceBook.name}'s Trade Name for this Item
                  </label>
                  <input
                    type="text"
                    value={priceFormData.vendorItemName}
                    onChange={(e) => setPriceFormData({ ...priceFormData, vendorItemName: e.target.value })}
                    placeholder="e.g. Monsoon Malabar Dark Roast"
                    className="w-full px-3.5 py-2 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                  />
                </div>

                {/* SKU, Price, Lead Time */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-espresso-600 dark:text-cafe-400 mb-1">
                      Vendor SKU
                    </label>
                    <input
                      type="text"
                      value={priceFormData.vendorSku}
                      onChange={(e) => setPriceFormData({ ...priceFormData, vendorSku: e.target.value.toUpperCase() })}
                      placeholder="MCR-MM-402"
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-espresso-600 dark:text-cafe-400 mb-1">
                      Contract Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={priceFormData.unitPrice}
                      onChange={(e) => setPriceFormData({ ...priceFormData, unitPrice: e.target.value })}
                      placeholder="1320"
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-espresso-600 dark:text-cafe-400 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      value={priceFormData.leadTimeDays}
                      onChange={(e) => setPriceFormData({ ...priceFormData, leadTimeDays: e.target.value })}
                      placeholder="2"
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Preferred toggle */}
                <label className="flex items-center gap-2 pt-1 text-xs font-bold text-espresso-800 dark:text-cafe-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceFormData.isPreferred}
                    onChange={(e) => setPriceFormData({ ...priceFormData, isPreferred: e.target.checked })}
                    className="w-4 h-4 rounded text-caramel-600"
                  />
                  <span>Mark as Preferred Supplier for this Item</span>
                </label>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cafe-100 dark:border-espresso-800">
                  <button
                    type="button"
                    onClick={() => setSelectedVendorForPriceBook(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso-600 hover:bg-cafe-100 dark:hover:bg-espresso-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-caramel-600 hover:bg-caramel-700 shadow-sm transition-all"
                  >
                    Save Price Agreement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
