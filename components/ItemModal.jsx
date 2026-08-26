'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Edit3,
  Coffee,
  Package,
  IndianRupee,
  AlertTriangle,
  Building,
  FileText,
  Sparkles,
  Layers,
  Scale,
  Star,
  Trash2,
  Tag,
} from 'lucide-react';
import { generateSku } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { INITIAL_CATEGORIES } from '@/services/seedData';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'units', label: 'Units / Pieces' },
  { value: 'packs', label: 'Packs / Bags' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'boxes', label: 'Boxes / Cases' },
];

export default function ItemModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  registeredVendors = [],
  itemToEdit = null,
}) {
  const activeCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    sku: '',
    quantity: '',
    unit: 'packs',
    packageWeight: '1.0',
    packageWeightUnit: 'kg',
    unitPrice: '',
    reorderLevel: '5',
    parLevel: '20',
    supplier: '',
    notes: '',
    vendorMappings: [],
  });
  const [newVendor, setNewVendor] = useState({
    vendorName: '',
    vendorItemName: '',
    vendorSku: '',
    unitPrice: '',
    isPreferred: false,
    leadTimeDays: '2',
    notes: '',
  });
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name || '',
        categoryId: itemToEdit.categoryId || (activeCategories[0]?.id || 'cat-coffee'),
        sku: itemToEdit.sku || '',
        quantity: itemToEdit.quantity !== undefined ? String(itemToEdit.quantity) : '0',
        unit: itemToEdit.unit || 'packs',
        packageWeight: itemToEdit.packageWeight !== undefined ? String(itemToEdit.packageWeight) : '1.0',
        packageWeightUnit: itemToEdit.packageWeightUnit || (itemToEdit.unit === 'liters' ? 'L' : 'kg'),
        unitPrice: itemToEdit.unitPrice !== undefined ? String(itemToEdit.unitPrice) : '',
        reorderLevel: itemToEdit.reorderLevel !== undefined ? String(itemToEdit.reorderLevel) : '5',
        parLevel: itemToEdit.parLevel !== undefined ? String(itemToEdit.parLevel) : '20',
        supplier: itemToEdit.supplier || '',
        notes: itemToEdit.notes || '',
        vendorMappings: Array.isArray(itemToEdit.vendorMappings) ? itemToEdit.vendorMappings : [],
      });
    } else {
      setFormData({
        name: '',
        categoryId: activeCategories[0]?.id || 'cat-coffee',
        sku: '',
        quantity: '10',
        unit: 'packs',
        packageWeight: '1.0',
        packageWeightUnit: 'kg',
        unitPrice: '0',
        reorderLevel: '5',
        parLevel: '20',
        supplier: '',
        notes: '',
        vendorMappings: [],
      });
    }
    setShowAddVendorForm(false);
    setNewVendor({
      vendorName: '',
      vendorItemName: '',
      vendorSku: '',
      unitPrice: '',
      isPreferred: false,
      leadTimeDays: '2',
      notes: '',
    });
    setErrors({});
  }, [itemToEdit, categories, isOpen]);

  const handleAddVendorMapping = () => {
    if (!newVendor.vendorName.trim()) {
      alert('Please enter a vendor / supplier name');
      return;
    }
    const mapping = {
      mappingId: 'vm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      vendorName: newVendor.vendorName.trim(),
      vendorItemName: newVendor.vendorItemName.trim() || formData.name.trim(),
      vendorSku: newVendor.vendorSku.trim().toUpperCase() || formData.sku.trim(),
      unitPrice: Number(newVendor.unitPrice) || Number(formData.unitPrice) || 0,
      isPreferred: Boolean(newVendor.isPreferred),
      leadTimeDays: Number(newVendor.leadTimeDays) || 2,
      notes: newVendor.notes.trim(),
    };

    let updatedMappings = [...(formData.vendorMappings || [])];
    if (mapping.isPreferred) {
      updatedMappings = updatedMappings.map((m) => ({ ...m, isPreferred: false }));
      setFormData((prev) => ({
        ...prev,
        supplier: mapping.vendorName,
        unitPrice: mapping.unitPrice > 0 ? String(mapping.unitPrice) : prev.unitPrice,
        vendorMappings: [...updatedMappings, mapping],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vendorMappings: [...updatedMappings, mapping],
      }));
    }

    setNewVendor({
      vendorName: '',
      vendorItemName: '',
      vendorSku: '',
      unitPrice: '',
      isPreferred: false,
      leadTimeDays: '2',
      notes: '',
    });
    setShowAddVendorForm(false);
  };

  const handleRemoveVendorMapping = (mappingId) => {
    setFormData((prev) => ({
      ...prev,
      vendorMappings: (prev.vendorMappings || []).filter((m) => m.mappingId !== mappingId),
    }));
  };

  const handleSetPreferredVendor = (mappingId) => {
    setFormData((prev) => {
      const updated = (prev.vendorMappings || []).map((m) => ({
        ...m,
        isPreferred: m.mappingId === mappingId,
      }));
      const preferred = updated.find((m) => m.mappingId === mappingId);
      return {
        ...prev,
        supplier: preferred ? preferred.vendorName : prev.supplier,
        unitPrice: preferred && preferred.unitPrice > 0 ? String(preferred.unitPrice) : prev.unitPrice,
        vendorMappings: updated,
      };
    });
  };

  const handleGenerateSku = () => {
    const selectedCat = activeCategories.find((c) => c.id === formData.categoryId);
    const catName = selectedCat ? selectedCat.name : 'GEN';
    const newSku = generateSku(catName, formData.name || 'ITEM');
    setFormData((prev) => ({ ...prev, sku: newSku }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product / ingredient name is required';
    if (formData.quantity !== '' && (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0)) {
      errs.quantity = 'Quantity must be a positive number';
    }
    if (formData.unitPrice !== '' && (isNaN(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0)) {
      errs.unitPrice = 'Unit price must be a positive number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const selectedCat = categories.find((c) => c.id === formData.categoryId) || activeCategories[0];
      const catId = selectedCat?.id || 'cat-coffee';
      const catName = selectedCat?.name || 'GEN';
      const cleanSku = formData.sku.trim() || generateSku(catName, formData.name);
      const cleanQty = formData.quantity !== '' ? Math.max(0, Number(formData.quantity) || 0) : 0;
      const cleanPrice = formData.unitPrice !== '' ? Math.max(0, Number(formData.unitPrice) || 0) : 0;
      const cleanReorder = formData.reorderLevel !== '' ? Math.max(0, Number(formData.reorderLevel) || 5) : 5;
      const cleanPar = formData.parLevel !== '' ? Math.max(cleanReorder, Number(formData.parLevel) || 20) : 20;

      await onSubmit({
        name: formData.name.trim(),
        categoryId: catId,
        sku: cleanSku,
        quantity: cleanQty,
        unit: formData.unit || 'packs',
        packageWeight: Number(formData.packageWeight) || 1.0,
        packageWeightUnit: formData.packageWeightUnit || 'kg',
        unitPrice: cleanPrice,
        reorderLevel: cleanReorder,
        parLevel: cleanPar,
        supplier: formData.supplier.trim() || 'Direct Supplier',
        notes: formData.notes.trim(),
        vendorMappings: formData.vendorMappings || [],
      });
      onClose();
    } catch (err) {
      console.error(err);
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
        className="relative w-full max-w-xl bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cafe-100 dark:border-espresso-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/50 shadow-sm">
                  {itemToEdit ? <Edit3 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                    {itemToEdit ? 'Edit Catalogue Item' : 'New Inventory Item'}
                  </h3>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400">
                    {itemToEdit ? 'Update pricing, PAR levels, and vendor parameters' : 'Configure item, pricing in INR (₹), and PAR capacity'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Chikmagalur Estate Arabica (Washed AAA)"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border text-espresso-900 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 outline-none ${
                    errors.name ? 'border-red-500' : 'border-cafe-200 dark:border-espresso-700'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 outline-none"
                  >
                    {activeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white dark:bg-espresso-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300">
                      SKU Code
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="text-[10px] font-semibold text-caramel-600 dark:text-caramel-400 hover:underline flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Auto SKU</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. COF-CHK-101"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 outline-none"
                  />
                </div>
              </div>

              {/* Quantity, Unit, Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Current Stock (Qty)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Package Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl text-xs font-bold bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 outline-none"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value} className="bg-white dark:bg-[#1C1612] text-espresso-950 dark:text-cafe-100">
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 outline-none text-center"
                  />
                </div>
              </div>

              {/* Package Specifications: Weight per Unit & Computed Weight on Hand */}
              <div className="p-3.5 rounded-2xl bg-caramel-50/60 dark:bg-caramel-950/20 border border-caramel-200/80 dark:border-caramel-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-caramel-600 dark:text-caramel-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-espresso-800 dark:text-cafe-200">
                      Weight / Volume per Unit (Package Size)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-caramel-700 dark:text-caramel-300">
                    Auto-fills in POs & Inventory
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-espresso-600 dark:text-cafe-300 mb-1">
                      Weight per Unit
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.packageWeight}
                        onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                        placeholder="e.g. 1.0 or 0.25"
                        className="w-full px-3 py-2 rounded-l-xl text-xs font-bold bg-white dark:bg-espresso-800 border border-caramel-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 outline-none text-center"
                      />
                      <select
                        value={formData.packageWeightUnit}
                        onChange={(e) => setFormData({ ...formData, packageWeightUnit: e.target.value })}
                        className="px-2 py-2 rounded-r-xl text-xs font-bold bg-caramel-100 dark:bg-espresso-700 border-y border-r border-caramel-200 dark:border-espresso-700 text-espresso-800 dark:text-cafe-200 outline-none cursor-pointer"
                      >
                        <option value="kg" className="bg-white dark:bg-[#1C1612] text-espresso-950 dark:text-cafe-100">kg</option>
                        <option value="g" className="bg-white dark:bg-[#1C1612] text-espresso-950 dark:text-cafe-100">g</option>
                        <option value="L" className="bg-white dark:bg-[#1C1612] text-espresso-950 dark:text-cafe-100">L</option>
                        <option value="ml" className="bg-white dark:bg-[#1C1612] text-espresso-950 dark:text-cafe-100">ml</option>
                        <option value="units" className="bg-white dark:bg-[#1C1612] text-espresso-950 dark:text-cafe-100">units</option>
                      </select>
                    </div>
                    <p className="text-[9px] text-espresso-500 mt-0.5">e.g. 1 kg bag, 250g pouch, 750ml bottle</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-espresso-600 dark:text-cafe-300 mb-1">
                      Total Calculated Net Stock
                    </label>
                    <div className="px-3 py-2 rounded-xl text-xs font-extrabold bg-white dark:bg-espresso-800 border border-caramel-200 dark:border-espresso-700 text-caramel-800 dark:text-caramel-300 text-center flex items-center justify-center min-h-[36px]">
                      {((Number(formData.quantity) || 0) * (Number(formData.packageWeight) || 1)).toFixed(1)} {formData.packageWeightUnit}
                    </div>
                    <p className="text-[9px] text-espresso-500 mt-0.5">
                      {formData.quantity || 0} {formData.unit} × {formData.packageWeight || 1} {formData.packageWeightUnit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thresholds: Reorder Trigger Level & PAR Capacity Level */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-cafe-50/70 dark:bg-espresso-900/40 border border-cafe-200/80 dark:border-espresso-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 mb-1">
                    Reorder Trigger (Min Safety)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-espresso-800 border border-amber-300 dark:border-amber-800 text-espresso-900 dark:text-cafe-50 outline-none text-center"
                  />
                  <p className="text-[9px] text-espresso-400 mt-0.5">Triggers shortage alert when reached</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                    PAR Level (Max Storage Capacity)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.parLevel}
                    onChange={(e) => setFormData({ ...formData, parLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-espresso-800 border border-emerald-300 dark:border-emerald-800 text-espresso-900 dark:text-cafe-50 outline-none text-center"
                  />
                  <p className="text-[9px] text-espresso-400 mt-0.5">Target restock quantity: PAR - Stock</p>
                </div>
              </div>

              {/* Multi-Vendor Sourcing & Dynamic Price Sheet (PRD FR-VM-1, FR-VM-2, FR-VM-3) */}
              <div className="p-4 rounded-2xl bg-cafe-50/80 dark:bg-espresso-900/40 border border-cafe-200 dark:border-espresso-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-espresso-950 dark:text-cafe-50">
                        Vendor Sourcing & Price Sheet
                      </h4>
                      <p className="text-[10px] text-espresso-500 dark:text-cafe-400">
                        Map multiple suppliers with custom trade names, SKUs, and contract prices.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddVendorForm(!showAddVendorForm)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-caramel-100 text-caramel-800 dark:bg-caramel-950 dark:text-caramel-300 border border-caramel-300 dark:border-caramel-800/80 hover:bg-caramel-200 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddVendorForm ? 'Close Form' : '+ Add Vendor'}</span>
                  </button>
                </div>

                {/* New Vendor Mapping Form */}
                <AnimatePresence>
                  {showAddVendorForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 rounded-xl bg-white dark:bg-espresso-800 border border-caramel-300/80 dark:border-caramel-900/60 space-y-2.5 shadow-sm overflow-hidden"
                    >
                      <p className="text-[10px] font-bold uppercase text-caramel-800 dark:text-caramel-300">
                        New Supplier Price Agreement
                      </p>

                      {/* Registered Store Vendors Quick Suggestions */}
                      {registeredVendors.length > 0 && (
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-bold text-espresso-500 dark:text-cafe-400">
                            Quick Select Registered Supplier:
                          </label>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 rounded-lg bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200/80 dark:border-espresso-700">
                            {registeredVendors.map((rv) => (
                              <button
                                key={rv.id}
                                type="button"
                                onClick={() => {
                                  setNewVendor((prev) => ({
                                    ...prev,
                                    vendorName: rv.name,
                                    leadTimeDays: String(rv.leadTimeDays || 2),
                                    notes: rv.notes || '',
                                  }));
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                                  newVendor.vendorName.toLowerCase().trim() === rv.name.toLowerCase().trim()
                                    ? 'bg-caramel-600 text-white border-caramel-600 shadow-xs'
                                    : 'bg-white dark:bg-espresso-800 text-espresso-700 dark:text-cafe-200 border-cafe-200 dark:border-espresso-600 hover:border-caramel-400'
                                }`}
                              >
                                {rv.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-espresso-600 dark:text-cafe-300 mb-0.5">
                            Supplier / Vendor Name *
                          </label>
                          <input
                            type="text"
                            list="registered-vendors-datalist"
                            value={newVendor.vendorName}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = registeredVendors.find(
                                (rv) => rv.name.toLowerCase().trim() === val.toLowerCase().trim()
                              );
                              if (matched) {
                                setNewVendor({
                                  ...newVendor,
                                  vendorName: matched.name,
                                  leadTimeDays: String(matched.leadTimeDays || 2),
                                  notes: matched.notes || '',
                                });
                              } else {
                                setNewVendor({ ...newVendor, vendorName: val });
                              }
                            }}
                            placeholder="Type or pick registered supplier..."
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/70 border border-cafe-200 dark:border-espresso-700 rounded-lg outline-none focus:ring-1 focus:ring-caramel-500"
                          />
                          <datalist id="registered-vendors-datalist">
                            {registeredVendors.map((rv) => (
                              <option key={rv.id} value={rv.name}>
                                {rv.city ? `${rv.city} (${rv.leadTimeDays}d lead)` : ''}
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-espresso-600 dark:text-cafe-300 mb-0.5">
                            Vendor's Trade Name for this Item
                          </label>
                          <input
                            type="text"
                            value={newVendor.vendorItemName}
                            onChange={(e) => setNewVendor({ ...newVendor, vendorItemName: e.target.value })}
                            placeholder="e.g. Monsoon Malabar Dark Roast"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/70 border border-cafe-200 dark:border-espresso-700 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-espresso-600 dark:text-cafe-300 mb-0.5">
                            Vendor SKU
                          </label>
                          <input
                            type="text"
                            value={newVendor.vendorSku}
                            onChange={(e) => setNewVendor({ ...newVendor, vendorSku: e.target.value.toUpperCase() })}
                            placeholder="MCR-MM-402"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-cafe-50 dark:bg-espresso-900/70 border border-cafe-200 dark:border-espresso-700 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-espresso-600 dark:text-cafe-300 mb-0.5">
                            Contract Price (₹)
                          </label>
                          <input
                            type="number"
                            step="1"
                            value={newVendor.unitPrice}
                            onChange={(e) => setNewVendor({ ...newVendor, unitPrice: e.target.value })}
                            placeholder="e.g. 1320"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/70 border border-cafe-200 dark:border-espresso-700 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-espresso-600 dark:text-cafe-300 mb-0.5">
                            Lead Time (Days)
                          </label>
                          <input
                            type="number"
                            value={newVendor.leadTimeDays}
                            onChange={(e) => setNewVendor({ ...newVendor, leadTimeDays: e.target.value })}
                            placeholder="2"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/70 border border-cafe-200 dark:border-espresso-700 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs font-bold text-espresso-800 dark:text-cafe-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newVendor.isPreferred}
                            onChange={(e) => setNewVendor({ ...newVendor, isPreferred: e.target.checked })}
                            className="w-3.5 h-3.5 rounded text-caramel-600"
                          />
                          <span>Set as Preferred Supplier</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAddVendorMapping}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-caramel-600 hover:bg-caramel-700 transition-colors shadow-sm"
                        >
                          Save Vendor Agreement
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Existing Vendor Mappings List */}
                {(formData.vendorMappings || []).length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-white dark:bg-espresso-800/60 border border-cafe-200/80 dark:border-espresso-700/80 text-xs text-espresso-500">
                    No vendor-specific price mappings yet. Defaults to <strong>{formData.supplier || 'Primary Supplier'}</strong> at ₹{formData.unitPrice || 0}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(formData.vendorMappings || []).map((vm) => (
                      <div
                        key={vm.mappingId || vm.vendorName}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                          vm.isPreferred
                            ? 'bg-caramel-50/70 dark:bg-caramel-950/40 border-caramel-300 dark:border-caramel-800'
                            : 'bg-white dark:bg-espresso-800/80 border-cafe-200 dark:border-espresso-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-espresso-950 dark:text-cafe-50">
                              {vm.vendorName}
                            </span>
                            {vm.isPreferred && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                Preferred
                              </span>
                            )}
                            {vm.vendorSku && (
                              <span className="font-mono text-[10px] text-espresso-400">
                                {vm.vendorSku}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-espresso-600 dark:text-cafe-300 mt-0.5 truncate">
                            Vendor Title: <em>"{vm.vendorItemName || formData.name}"</em>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-espresso-950 dark:text-cafe-50 text-xs">
                              ₹{Number(vm.unitPrice).toFixed(2)}
                            </p>
                            <p className="text-[9px] text-espresso-400">per {formData.unit}</p>
                          </div>

                          {!vm.isPreferred && (
                            <button
                              type="button"
                              onClick={() => handleSetPreferredVendor(vm.mappingId)}
                              className="text-[10px] font-bold text-caramel-600 hover:underline px-1.5 py-0.5 rounded border border-caramel-200 dark:border-caramel-800"
                              title="Set as Preferred Vendor"
                            >
                              Make Preferred
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveVendorMapping(vm.mappingId)}
                            className="p-1 text-espresso-400 hover:text-red-600 transition-colors"
                            title="Remove vendor mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Storage Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                  Internal Notes / Storage
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Store in dry airtight container"
                  className="w-full px-3.5 py-2 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cafe-100 dark:border-espresso-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
