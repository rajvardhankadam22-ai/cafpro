'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePlus,
  Plus,
  Trash2,
  Package,
  Building,
  IndianRupee,
  Calendar,
  X,
  Check,
  Sparkles,
  Search,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CreatePoModal({
  isOpen,
  onClose,
  inventoryItems = [],
  initialSupplier = '',
  initialItems = [],
  onCreatePo,
  onSubmit,
}) {
  const submitHandler = onSubmit || onCreatePo;
  const [supplierName, setSupplierName] = useState('');
  const [isSupplierMenuOpen, setIsSupplierMenuOpen] = useState(false);
  const [filterBySupplier, setFilterBySupplier] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Extract unique suppliers from inventory
  const existingSuppliers = Array.from(
    new Set(inventoryItems.map((i) => i.supplier).filter(Boolean))
  );

  const resolveItemForVendor = (item, vendor) => {
    const currentQty = Number(item.quantity) || 0;
    const par = Number(item.parLevel) || ((Number(item.reorderLevel) || 5) * 2);
    const suggested = Math.ceil(Math.max(1, par - currentQty));

    const mapping = (item.vendorMappings || []).find(
      (vm) => vm.vendorName && vendor && vm.vendorName.toLowerCase().trim() === vendor.toLowerCase().trim()
    );

    const vendorItemName = mapping?.vendorItemName || item.name;
    const vendorSku = mapping?.vendorSku || item.sku;
    const resolvedPrice = mapping && Number(mapping.unitPrice) > 0 ? Number(mapping.unitPrice) : (Number(item.unitPrice) || 0);

    return {
      itemId: item.id,
      itemName: vendorItemName,
      masterItemName: item.name,
      sku: vendorSku,
      masterSku: item.sku,
      hasCustomMapping: Boolean(mapping),
      orderedQty: suggested,
      unit: item.unit || 'units',
      packageWeight: Number(item.packageWeight) || 1.0,
      packageWeightUnit: item.packageWeightUnit || (item.unit === 'liters' ? 'L' : 'kg'),
      unitPrice: resolvedPrice,
      mappingId: mapping?.mappingId || null,
    };
  };

  useEffect(() => {
    const validSupplier = typeof initialSupplier === 'string' ? initialSupplier.trim() : '';
    let selectedSup = validSupplier;
    if (validSupplier) {
      setSupplierName(validSupplier);
    } else if (existingSuppliers.length > 0) {
      selectedSup = existingSuppliers[0];
      setSupplierName(selectedSup);
    } else {
      selectedSup = 'Western Ghats Plantations';
      setSupplierName(selectedSup);
    }

    if (Array.isArray(initialItems) && initialItems.length > 0) {
      setSelectedItems(
        initialItems.map((item) => resolveItemForVendor(item, selectedSup))
      );
    } else {
      setSelectedItems([]);
    }
    setValidationError('');
  }, [initialSupplier, initialItems, isOpen]);

  const handleAddItemToPo = (item) => {
    if (selectedItems.some((si) => si.itemId === item.id)) return;
    const resolved = resolveItemForVendor(item, supplierName);
    setSelectedItems([...selectedItems, resolved]);
    setValidationError('');
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, val) => {
    const updated = [...selectedItems];
    const parsed = Math.max(1, Math.round(parseFloat(val) || 1));
    updated[index].orderedQty = parsed;
    setSelectedItems(updated);
  };

  const handlePriceChange = (index, val) => {
    const updated = [...selectedItems];
    updated[index].unitPrice = Math.max(0, parseFloat(val) || 0);
    setSelectedItems(updated);
  };

  const totalEstimatedCost = selectedItems.reduce(
    (acc, curr) => acc + curr.orderedQty * curr.unitPrice,
    0
  );

  // Supplier Products & Shortages
  const supplierItems = inventoryItems.filter(
    (item) =>
      (item.supplier && supplierName && item.supplier.toLowerCase().trim() === supplierName.toLowerCase().trim()) ||
      (item.vendorMappings || []).some((vm) => vm.vendorName && vm.vendorName.toLowerCase().trim() === supplierName.toLowerCase().trim())
  );

  const supplierShortages = supplierItems.filter((item) => {
    const currentQty = Number(item.quantity) || 0;
    const par = Number(item.parLevel) || ((Number(item.reorderLevel) || 5) * 2);
    return currentQty < par && !selectedItems.some((si) => si.itemId === item.id);
  });

  const handleAddAllSupplierShortages = () => {
    const newItems = supplierShortages.map((item) => resolveItemForVendor(item, supplierName));
    if (newItems.length > 0) {
      setSelectedItems([...selectedItems, ...newItems]);
      setValidationError('');
    }
  };

  // Filter available items for quick add
  const availableItems = inventoryItems.filter((item) => {
    const matchQuery =
      !itemSearch ||
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(itemSearch.toLowerCase()));

    if (filterBySupplier && supplierName) {
      const matchSupplier =
        (item.supplier && item.supplier.toLowerCase().trim() === supplierName.toLowerCase().trim()) ||
        (item.vendorMappings || []).some((vm) => vm.vendorName && vm.vendorName.toLowerCase().trim() === supplierName.toLowerCase().trim());
      return matchQuery && matchSupplier;
    }

    return matchQuery;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const finalSupplier = (typeof supplierName === 'string' ? supplierName : '').trim();
    if (!finalSupplier) {
      setValidationError('Please enter or select a vendor / supplier name.');
      return;
    }

    if (selectedItems.length === 0) {
      setValidationError('Please add at least 1 item to this Purchase Order.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (submitHandler) {
        await submitHandler({
          supplierName: finalSupplier,
          items: selectedItems,
          notes,
          expectedDelivery,
        });
      }
      onClose();
      setSelectedItems([]);
    } catch (err) {
      console.error(err);
      setValidationError('Failed to issue Purchase Order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/75 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cafe-100 dark:border-espresso-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/50 shadow-sm">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                    Draft New Purchase Order (PO)
                  </h3>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400">
                    Order goods from suppliers. Stock will update upon delivery inspection.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200 p-1.5 rounded-xl hover:bg-cafe-100 dark:hover:bg-espresso-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Alert */}
            {validationError && (
              <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Content Body */}
            <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Supplier & Delivery Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1.5 flex items-center justify-between">
                    <span>Vendor / Supplier Name <span className="text-red-500">*</span></span>
                    {supplierItems.length > 0 && (
                      <span className="text-[10px] text-caramel-600 dark:text-caramel-400 font-semibold normal-case">
                        {supplierItems.length} products available
                      </span>
                    )}
                  </label>
                  
                  {/* Custom Interactive Supplier Input & Dropdown */}
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => {
                          setSupplierName(e.target.value);
                          setIsSupplierMenuOpen(true);
                        }}
                        onFocus={() => setIsSupplierMenuOpen(true)}
                        placeholder="Type or select supplier..."
                        className="w-full pl-3.5 pr-8 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setIsSupplierMenuOpen(!isSupplierMenuOpen)}
                        className="absolute right-2.5 p-1 text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSupplierMenuOpen ? 'rotate-180 text-caramel-600' : ''}`} />
                      </button>
                    </div>

                    {/* Popover Dropdown Menu */}
                    <AnimatePresence>
                      {isSupplierMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsSupplierMenuOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1a1411] rounded-2xl border border-cafe-200 dark:border-espresso-700 shadow-cafe-xl z-40 p-2 max-h-56 overflow-y-auto space-y-1"
                          >
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-espresso-400 dark:text-cafe-400">
                              Registered Store Vendors ({existingSuppliers.length})
                            </p>
                            {existingSuppliers.length === 0 ? (
                              <p className="px-2 py-2 text-xs text-espresso-500">
                                Type any new vendor name to create PO.
                              </p>
                            ) : (
                              existingSuppliers.map((s) => {
                                const count = inventoryItems.filter(
                                  (i) => i.supplier && i.supplier.toLowerCase() === s.toLowerCase()
                                ).length;
                                const isSelected = supplierName.toLowerCase() === s.toLowerCase();
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      setSupplierName(s);
                                      setIsSupplierMenuOpen(false);
                                      setFilterBySupplier(true);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                                      isSelected
                                        ? 'bg-caramel-100/80 text-caramel-900 dark:bg-caramel-950 dark:text-caramel-200'
                                        : 'hover:bg-cafe-100 dark:hover:bg-espresso-800 text-espresso-800 dark:text-cafe-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Building className="w-3.5 h-3.5 text-caramel-600" />
                                      <span>{s}</span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-cafe-200/60 dark:bg-espresso-700 text-espresso-600 dark:text-cafe-300">
                                      {count} items
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  />
                </div>
              </div>

              {/* Add Items from Catalogue */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300">
                    Add Items to Order
                  </label>

                  {/* Supplier Filter Toggle */}
                  {supplierName && supplierItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterBySupplier(!filterBySupplier)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          filterBySupplier
                            ? 'bg-caramel-100 text-caramel-800 border-caramel-300 dark:bg-caramel-950 dark:text-caramel-300'
                            : 'bg-cafe-100 text-espresso-600 border-cafe-200 dark:bg-espresso-800 dark:text-cafe-400'
                        }`}
                      >
                        {filterBySupplier ? `Showing ${supplierName} (${supplierItems.length})` : 'Show All Items'}
                      </button>
                      
                      {supplierShortages.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAddAllSupplierShortages}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>+ Add {supplierShortages.length} Shortages</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search catalogue items by name or SKU..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                  />
                </div>

                {/* Item Pills */}
                {inventoryItems.length === 0 ? (
                  <div className="p-4 text-center bg-cafe-50 dark:bg-espresso-900/30 rounded-2xl text-xs text-espresso-500">
                    No items in inventory catalogue yet. Please add items to your inventory first.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2.5 bg-cafe-50/60 dark:bg-espresso-900/40 rounded-2xl border border-cafe-200/60 dark:border-espresso-800">
                    {availableItems.map((item) => {
                      const isAdded = selectedItems.some((si) => si.itemId === item.id);
                      const mapping = (item.vendorMappings || []).find(
                        (vm) => vm.vendorName && supplierName && vm.vendorName.toLowerCase().trim() === supplierName.toLowerCase().trim()
                      );
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAddItemToPo(item)}
                          disabled={isAdded}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isAdded
                              ? 'bg-cafe-200/60 text-espresso-400 border-cafe-200 dark:bg-espresso-800/40 opacity-60'
                              : mapping
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-espresso-800 dark:text-cafe-100 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 shadow-sm'
                              : 'bg-white dark:bg-espresso-800 text-espresso-800 dark:text-cafe-100 border-cafe-200 dark:border-espresso-700 hover:border-caramel-500 shadow-sm'
                          }`}
                        >
                          <Plus className="w-3 h-3 text-caramel-600" />
                          <span>{mapping ? mapping.vendorItemName : item.name}</span>
                          {mapping && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                              ₹{mapping.unitPrice}
                            </span>
                          )}
                          <span className="text-[10px] text-espresso-400 font-mono">
                            ({item.quantity}/{item.parLevel || 20} {item.unit})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected PO Items Table */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300">
                  Purchase Order Line Items ({selectedItems.length})
                </label>

                {selectedItems.length === 0 ? (
                  <div className="p-6 text-center bg-cafe-50/50 dark:bg-espresso-900/30 rounded-2xl border border-dashed border-cafe-300 dark:border-espresso-800 text-xs text-espresso-500">
                    Click items in the box above to add them to this Purchase Order.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={item.itemId || idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-800 space-y-2 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-espresso-950 dark:text-cafe-50 truncate">
                                {item.itemName}
                              </h4>
                              {item.hasCustomMapping && (
                                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                  ✓ Vendor Agreement
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {item.masterItemName && item.masterItemName !== item.itemName && (
                                <span className="text-[10px] text-espresso-500 dark:text-cafe-400 font-medium">
                                  🏬 Store Master: <strong className="text-espresso-800 dark:text-cafe-200">{item.masterItemName}</strong>
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-espresso-400">
                                SKU: {item.sku || 'ITEM'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-caramel-50 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 border border-caramel-200/50">
                                {item.packageWeight || 1.0} {item.packageWeightUnit || 'kg'}/unit
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-espresso-400 dark:text-cafe-400 mb-0.5">
                                Order Quantity
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={item.orderedQty}
                                  onChange={(e) => handleQtyChange(idx, e.target.value)}
                                  className="w-20 px-2 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 rounded-l-lg text-center text-espresso-950 dark:text-cafe-50 outline-none"
                                />
                                <span className="px-2 py-1.5 text-[10px] font-bold bg-cafe-200/70 dark:bg-espresso-700 border-y border-r border-cafe-200 dark:border-espresso-700 rounded-r-lg text-espresso-700 dark:text-cafe-300">
                                  {item.unit === 'kg' ? 'packs' : item.unit === 'liters' ? 'cartons' : item.unit}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase font-bold text-espresso-400 mb-0.5">
                                Price / Unit (₹)
                              </label>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handlePriceChange(idx, e.target.value)}
                                className="w-24 px-2 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-800 border border-cafe-200 dark:border-espresso-700 rounded-lg text-center text-espresso-950 dark:text-cafe-50 outline-none"
                              />
                            </div>

                            <div className="text-right min-w-[70px]">
                              <label className="block text-[9px] uppercase font-bold text-espresso-400 mb-0.5">
                                Total
                              </label>
                              <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50">
                                {formatCurrency(item.orderedQty * item.unitPrice)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-espresso-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Calculated Net Weight and Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-cafe-100 dark:border-espresso-800/80 text-[10px]">
                          <span className="font-medium text-espresso-600 dark:text-cafe-400">
                            📦 Calculated Net Weight: <strong className="text-caramel-700 dark:text-caramel-300 font-extrabold">{((Number(item.orderedQty) || 0) * (Number(item.packageWeight) || 1.0)).toFixed(1)} {item.packageWeightUnit || 'kg'}</strong>
                            <span className="text-espresso-400 ml-1">({item.orderedQty} × {item.packageWeight || 1.0} {item.packageWeightUnit || 'kg'})</span>
                          </span>
                          <span className="font-bold text-espresso-700 dark:text-cafe-300">
                            Cost: {formatCurrency(item.orderedQty * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1.5">
                  Order Instructions & Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver to back dock before morning service"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                />
              </div>

              {/* Estimated PO Summary */}
              <div className="p-4 rounded-2xl bg-caramel-50/70 dark:bg-caramel-950/30 border border-caramel-200 dark:border-caramel-800/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-caramel-950 dark:text-caramel-200">
                    Total Estimated PO Budget
                  </p>
                  <p className="text-[11px] text-caramel-700 dark:text-caramel-400">
                    {selectedItems.length} items ordered from {supplierName || 'Supplier'}
                  </p>
                </div>
                <p className="text-lg font-extrabold text-caramel-900 dark:text-caramel-100">
                  {formatCurrency(totalEstimatedCost)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95 disabled:opacity-50"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Issuing PO...' : 'Issue Purchase Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
